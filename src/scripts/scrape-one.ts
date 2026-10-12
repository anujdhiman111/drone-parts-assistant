import { getAdapterForUrl } from '../sites/registry';
import { closeBrowser } from '../sites/browser';

async function main(): Promise<void> {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: npm run scrape -- <product-url>');
    process.exit(1);
  }

  const adapter = getAdapterForUrl(url);
  if (!adapter) {
    console.error('Unsupported URL hostname');
    process.exit(1);
  }

  try {
    const result = await adapter.scrape(url);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await closeBrowser();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
