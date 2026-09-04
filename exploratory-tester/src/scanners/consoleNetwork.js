/**
 * Attach console/network/page-error capture to a page. Must be called BEFORE
 * page.goto() so nothing emitted during initial load is missed. Returns an
 * accessor for the results collected so far.
 */
export function attachConsoleNetworkCapture(page) {
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  const badResponses = [];

  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error" || type === "warning") {
      consoleMessages.push({ type, text: msg.text() });
    }
  });

  page.on("pageerror", (err) => {
    pageErrors.push(String(err.message || err));
  });

  page.on("requestfailed", (req) => {
    failedRequests.push({ url: req.url(), failure: req.failure()?.errorText || "unknown" });
  });

  page.on("response", (res) => {
    const status = res.status();
    if (status >= 400) {
      badResponses.push({ url: res.url(), status });
    }
  });

  return {
    getResults() {
      return {
        consoleMessages: [...consoleMessages],
        pageErrors: [...pageErrors],
        failedRequests: [...failedRequests],
        badResponses: [...badResponses],
      };
    },
  };
}
