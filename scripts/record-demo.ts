import { spawn, ChildProcess } from 'child_process';
import { chromium, Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { Client, TablesDB, Query, ID } from 'node-appwrite';

const BENGALURU_COORDS = { latitude: 12.9716, longitude: 77.5946 };

// Helper to inject lower-third banner and cursor into the page
async function setupPageEnhancements(page: Page) {
  try {
    await page.addStyleTag({
      content: `
        #demo-banner {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.94);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(16, 185, 129, 0.4);
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px rgba(16, 185, 129, 0.25);
          padding: 14px 28px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 999999;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
          max-width: 90vw;
        }
        #demo-banner.hidden {
          opacity: 0;
          transform: translate(-50%, 20px);
        }
        #demo-banner-tag {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 10px;
          border-radius: 9999px;
          border: 1px solid rgba(52, 211, 153, 0.3);
          white-space: nowrap;
        }
        #demo-banner-title {
          color: #ffffff;
          font-weight: 700;
          font-size: 15px;
          margin: 0;
          white-space: nowrap;
        }
        #demo-banner-sub {
          color: #94a3b8;
          font-size: 13px;
          font-weight: 500;
          margin: 0;
          white-space: nowrap;
        }
        #demo-cursor {
          position: fixed;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.7);
          border: 2px solid #ffffff;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.8);
          pointer-events: none;
          z-index: 1000000;
          transition: transform 0.15s ease-out, background 0.15s ease-out;
          transform: translate(-50%, -50%);
          display: none;
        }
        #demo-cursor.clicking {
          transform: translate(-50%, -50%) scale(0.7);
          background: #059669;
        }
      `,
    });

    await page.evaluate(() => {
      if (!document.getElementById('demo-banner')) {
        const banner = document.createElement('div');
        banner.id = 'demo-banner';
        banner.className = 'hidden';
        banner.innerHTML = `
          <span id="demo-banner-tag">Commons</span>
          <div style="display:flex; flex-direction:column; gap:2px;">
            <h4 id="demo-banner-title">Share more. Waste less.</h4>
            <p id="demo-banner-sub">Community-first resource sharing network</p>
          </div>
        `;
        document.body.appendChild(banner);
      }

      if (!document.getElementById('demo-cursor')) {
        const cursor = document.createElement('div');
        cursor.id = 'demo-cursor';
        document.body.appendChild(cursor);
        window.addEventListener('mousemove', (e) => {
          cursor.style.display = 'block';
          cursor.style.left = e.clientX + 'px';
          cursor.style.top = e.clientY + 'px';
        });
        window.addEventListener('mousedown', () => cursor.classList.add('clicking'));
        window.addEventListener('mouseup', () => cursor.classList.remove('clicking'));
      }
    });
  } catch {}
}

async function showBanner(page: Page, tag: string, title: string, subtitle: string, durationMs = 3500) {
  try {
    await setupPageEnhancements(page);
    await page.evaluate(
      ({ tag, title, subtitle }) => {
        const banner = document.getElementById('demo-banner');
        const tagEl = document.getElementById('demo-banner-tag');
        const titleEl = document.getElementById('demo-banner-title');
        const subEl = document.getElementById('demo-banner-sub');
        if (banner && tagEl && titleEl && subEl) {
          tagEl.textContent = tag;
          titleEl.textContent = title;
          subEl.textContent = subtitle;
          banner.classList.remove('hidden');
        }
      },
      { tag, title, subtitle }
    );
    if (durationMs > 0) {
      await page.waitForTimeout(durationMs);
    }
  } catch {}
}

async function smoothScroll(page: Page, targetY: number, steps = 25, intervalMs = 25) {
  try {
    const currentY = await page.evaluate(() => window.scrollY);
    const diff = targetY - currentY;
    for (let i = 1; i <= steps; i++) {
      const y = currentY + (diff * (i / steps));
      await page.evaluate((pos) => window.scrollTo({ top: pos, behavior: 'instant' }), y);
      await page.waitForTimeout(intervalMs);
    }
  } catch {}
}

async function ensureAwaitingHandoverTransaction(): Promise<string> {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
  const apiKey = process.env.APPWRITE_API_KEY!;
  const dbId = process.env.APPWRITE_DATABASE_ID!;

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const tablesDb = new TablesDB(client);

  try {
    const existing = await tablesDb.listRows({
      databaseId: dbId,
      tableId: 'transactions',
      queries: [Query.equal('status', 'awaiting_handover'), Query.limit(1)],
    });
    if (existing.total > 0) {
      return existing.rows[0].$id;
    }

    const anyTx = await tablesDb.listRows({
      databaseId: dbId,
      tableId: 'transactions',
      queries: [Query.limit(1)],
    });

    if (anyTx.total > 0) {
      const tx = anyTx.rows[0];
      await tablesDb.updateRow({
        databaseId: dbId,
        tableId: 'transactions',
        rowId: tx.$id,
        data: {
          status: 'awaiting_handover',
          ownerConfirmed: false,
          borrowerConfirmed: false,
        },
      });
      return tx.$id;
    }
  } catch (err) {
    console.warn('Transaction check error:', err);
  }
  return '6ae47592002cc577d06a';
}

async function recordDemo() {
  console.log('🎬 Starting Commons Live Demo Recording...');

  const recordingsDir = path.join(process.cwd(), 'recordings');
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  // 1. Check or start Next.js production server
  let nextServer: ChildProcess | null = null;
  let serverRunning = false;

  try {
    const res = await fetch('http://localhost:3000');
    if (res.status === 200 || res.status === 304) {
      console.log('✓ Next.js server is already running on http://localhost:3000');
      serverRunning = true;
    }
  } catch {}

  if (!serverRunning) {
    console.log('Starting Next.js production server on http://localhost:3000...');
    nextServer = spawn('pnpm.cmd', ['start'], {
      shell: true,
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    // Wait until server is reachable
    for (let i = 0; i < 30; i++) {
      try {
        await new Promise((r) => setTimeout(r, 1000));
        const res = await fetch('http://localhost:3000');
        if (res.status === 200 || res.status === 304) {
          console.log('✓ Next.js server is up and responsive!');
          serverRunning = true;
          break;
        }
      } catch {}
    }

    if (!serverRunning) {
      throw new Error('Failed to start Next.js server on port 3000');
    }
  }

  // Ensure an active transaction exists for the QR code showcase
  const activeTxId = await ensureAwaitingHandoverTransaction();
  console.log(`✓ Active handover transaction ID: ${activeTxId}`);

  // 2. Launch Chrome via Playwright with video recording
  console.log('Launching Google Chrome in 1920x1080 with Playwright video recorder...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    permissions: ['geolocation'],
    geolocation: BENGALURU_COORDS,
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  // SCENE 1: HOMEPAGE HERO & MISSION
  console.log('▶ Scene 1: Homepage & Mission Statement');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await showBanner(
    page,
    'Commons',
    'Share more. Waste less.',
    'A community-first resource sharing network turning neighborhoods into lending libraries',
    4000
  );

  // Smooth scroll past stats
  await showBanner(
    page,
    'Real-Time Metrics',
    'Collective Community Impact',
    'Tracking items shared, active hubs, and ₹ thousands saved across communities',
    3000
  );
  await smoothScroll(page, 750, 30, 20);
  await page.waitForTimeout(2000);

  // Scroll to feature pillars
  await smoothScroll(page, 1500, 30, 20);
  await page.waitForTimeout(2500);

  // Scroll smoothly back up to hero
  await smoothScroll(page, 0, 35, 15);
  await page.waitForTimeout(1500);

  // SCENE 2: DISCOVERY & GEOSPATIAL MAP
  console.log('▶ Scene 2: Geo-Spatial Discovery & OpenStreetMap');
  await page.goto('http://localhost:3000/discover', { waitUntil: 'networkidle' });
  await showBanner(
    page,
    'Discovery',
    'Native Geo-Spatial Discovery',
    'Instant proximity discovery using native Point & Polygon columns in Appwrite TablesDB',
    4000
  );

  // Search typing demonstration
  try {
    const searchInput = page.locator('input[placeholder*="Search by item name"]');
    if (await searchInput.isVisible()) {
      await searchInput.click();
      await page.keyboard.type('Camera', { delay: 100 });
      await page.waitForTimeout(1500);
      await page.locator('button:has-text("Search")').click();
      await page.waitForTimeout(2000);

      // Clear search
      await searchInput.fill('');
      await page.locator('button:has-text("Search")').click();
      await page.waitForTimeout(1500);
    }
  } catch {}

  // Click Near Me GPS proximity button
  try {
    const nearMeBtn = page.locator('button:has-text("Near Me")');
    if (await nearMeBtn.isVisible()) {
      await showBanner(
        page,
        'Proximity Search',
        'Instant Proximity Calculation',
        'Calculating precise Haversine distance with 1-click GPS device location',
        3500
      );
      await nearMeBtn.click();
      await page.waitForTimeout(2500);
    }
  } catch {}

  // Toggle to Map View
  try {
    const mapBtn = page.locator('button:has-text("Map")');
    if (await mapBtn.isVisible()) {
      await showBanner(
        page,
        'Privacy Guard',
        'Interactive OpenStreetMap & Neighborhood Centroid Fuzzing',
        'Exact residential street addresses are never exposed—fuzzed to 1km community centroids',
        4500
      );
      await mapBtn.click();
      await page.waitForTimeout(3000);

      // Click on a marker if available with force: true
      const marker = page.locator('.resource-pin-marker').first();
      if (await marker.isVisible({ timeout: 2000 }).catch(() => false)) {
        await marker.click({ force: true, timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(2500);
      }
    }

    // Toggle back to Grid
    const gridBtn = page.locator('button:has-text("Grid")');
    if (await gridBtn.isVisible()) {
      await gridBtn.click();
      await page.waitForTimeout(1500);
    }
  } catch {}

  // SCENE 3: RESOURCE DETAILS & LENDING RULES
  console.log('▶ Scene 3: Resource Details & Reservation');
  try {
    const dslrCard = page.locator('a[href*="/resources/"]').first();
    if (await dslrCard.isVisible()) {
      await showBanner(
        page,
        'Resource Specs',
        'Transparent Lending Terms & Condition Ratings',
        'Inspecting item condition, pickup neighborhood, and owner availability calendar',
        3500
      );
      await dslrCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Smooth scroll down the specs
      await smoothScroll(page, 450, 25, 20);
      await page.waitForTimeout(2500);

      // Open Request to Borrow modal
      const borrowBtn = page.locator('button:has-text("Request to Borrow")');
      if (await borrowBtn.isVisible()) {
        await showBanner(
          page,
          'Reservation Flow',
          'Direct Borrow Booking Request',
          'Select dates and propose terms directly to trusted community neighbors',
          3500
        );
        await borrowBtn.click();
        await page.waitForTimeout(2000);

        const msgInput = page.locator('textarea[placeholder*="message" i], textarea');
        if (await msgInput.isVisible()) {
          await msgInput.fill('Hi Alice! Would love to borrow this for our hackathon demo filming!');
          await page.waitForTimeout(1500);
        }

        // Close modal
        const closeBtn = page.locator('button:has-text("Cancel"), button[aria-label*="close" i]').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  } catch {}

  // SCENE 4: AUTHENTICATION & LOGIN
  console.log('▶ Scene 4: Member Authentication');
  try {
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle' });
    await showBanner(
      page,
      'Appwrite Auth',
      'Secure Session Persistence & SSR Cookie Verification',
      'Fast, zero-cost authentication powered by @appwrite.io/react and Appwrite Cloud',
      3500
    );

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('alice.fictional@commons.demo');
      await page.waitForTimeout(500);
      await passwordInput.fill('Password123!');
      await page.waitForTimeout(800);
      const submitBtn = page.locator('button[type="submit"]').first();
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }
  } catch {}

  // SCENE 5: IMPACT DASHBOARD
  console.log('▶ Scene 5: Personal & Community Impact Dashboard');
  try {
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await showBanner(
      page,
      'Impact Dashboard',
      'Real-Time Environmental & Economic Metrics',
      'Visualizing items kept out of landfills, CO2 emissions prevented, and community wealth retained',
      4000
    );
    await smoothScroll(page, 450, 25, 20);
    await page.waitForTimeout(3000);
  } catch {}

  // SCENE 6: COMMUNITY HUBS, CURATED KITS & CHALLENGES
  console.log('▶ Scene 6: Community Hub, Curated Kits & Challenges');
  try {
    await page.goto('http://localhost:3000/communities/6ae4758b0039bccec242', { waitUntil: 'networkidle' });
    await showBanner(
      page,
      'Community Hub',
      'Hyper-Local Group Governance & Curated Kits',
      'Bundling complementary gear (tents, cameras, tools) into 1-click packaged loans',
      4000
    );
    await smoothScroll(page, 600, 25, 20);
    await page.waitForTimeout(3000);

    // Scroll to challenges
    await showBanner(
      page,
      'Gamified Impact',
      'Collective Community Sustainability Challenges',
      'Mobilizing members together to reach shared targets: 250 kg CO2 diverted this semester',
      4000
    );
    await smoothScroll(page, 1100, 25, 20);
    await page.waitForTimeout(3500);
  } catch {}

  // SCENE 7: VERIFIED QR HANDOVER & LIFECYCLE
  console.log('▶ Scene 7: Cryptographic QR Handover & Return');
  try {
    await page.goto(`http://localhost:3000/transactions/${activeTxId}`, { waitUntil: 'networkidle' });
    await showBanner(
      page,
      'Verified Handover',
      'Cryptographic QR Handover & Return Verification',
      'Single-use dynamic QR codes ensure physical custody transfer and condition accountability',
      4500
    );

    const genCodeBtn = page.locator('button:has-text("Generate Handover Code")');
    if (await genCodeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await genCodeBtn.click();
      await page.waitForTimeout(2500);
    }

    await smoothScroll(page, 450, 25, 20);
    await page.waitForTimeout(4000);
  } catch {}

  // SCENE 8: CONCLUSION
  console.log('▶ Scene 8: Conclusion & Call to Action');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await smoothScroll(page, 0, 20, 15);
    await showBanner(
      page,
      'Commons',
      'Share more. Waste less.',
      'Built 100% on Appwrite Cloud • Zero external paid APIs • ₹0 Operating Cost',
      5000
    );
    await page.waitForTimeout(3000);
  } catch {}

  // Close context to finalize video recording
  console.log('Finalizing browser session and saving raw video recording...');
  await context.close();
  await browser.close();

  // Stop Next.js if we spawned it
  if (nextServer) {
    console.log('Stopping spawned Next.js server...');
    try {
      process.kill(nextServer.pid!, 'SIGTERM');
    } catch {}
  }

  // Find the generated webm file
  const files = fs.readdirSync(recordingsDir).filter((f) => f.endsWith('.webm'));
  if (files.length === 0) {
    throw new Error('No .webm video recording found in recordings directory!');
  }

  const latestWebm = files
    .map((f) => ({ name: f, time: fs.statSync(path.join(recordingsDir, f)).mtimeMs }))
    .sort((a, b) => b.time - a.time)[0].name;

  const webmPath = path.join(recordingsDir, latestWebm);
  const mp4Path = path.join(process.cwd(), 'commons-hackathon-demo.mp4');

  console.log(`Transcoding ${latestWebm} to pristine MP4 format: ${mp4Path}...`);
  execSync(
    `ffmpeg -y -i "${webmPath}" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p "${mp4Path}"`,
    { stdio: 'inherit' }
  );

  const stats = fs.statSync(mp4Path);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`🎉 SUCCESS! Demo video recorded and converted:`);
  console.log(`📹 File: ${mp4Path}`);
  console.log(`📊 Size: ${sizeMb} MB`);
}

recordDemo().catch((err) => {
  console.error('❌ Error recording demo:', err);
  process.exit(1);
});
