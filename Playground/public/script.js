(() => {
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  document.addEventListener("DOMContentLoaded", () => {
    initializeLandingPage();
    initializeAdminDashboard();
  });

  function initializeLandingPage() {
    const form = document.querySelector("[data-guest-form]");

    if (!form) {
      return;
    }

    const formPanel = document.querySelector("[data-form-panel]");
    const successPanel = document.querySelector("[data-success-panel]");
    const alertBox = document.querySelector("[data-form-alert]");
    const submitButton = form.querySelector('button[type="submit"]');
    const ssidElement = document.querySelector("[data-wifi-ssid]");
    const passwordElement = document.querySelector("[data-wifi-password]");
    const stepsList = document.querySelector("[data-connection-steps]");
    const guestName = document.querySelector("[data-guest-name]");
    const connectedAt = document.querySelector("[data-connected-at]");
    const supportCopy = document.querySelector("[data-support-copy]");
    const resetButton = document.querySelector("[data-reset-form]");
    const copyButton = document.querySelector("[data-copy-password]");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      hideAlert(alertBox);
      setButtonLoading(submitButton, true);

      const payload = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        device: getDeviceLabel(),
        website: form.elements.website.value.trim(),
      };

      try {
        const validationMessage = validateGuestPayload(payload);
        if (validationMessage) {
          throw new Error(validationMessage);
        }

        const response = await fetch("/api/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await parseJsonResponse(response);

        if (!response.ok || !result.success) {
          const validationMessage = Array.isArray(result.errors) && result.errors.length > 0
            ? result.errors.map((issue) => issue.message).join(" ")
            : result.message;

          throw new Error(validationMessage || "Unable to complete Wi-Fi registration.");
        }

        ssidElement.textContent = result.data.wifi.ssid;
        passwordElement.textContent = result.data.wifi.password;
        guestName.textContent = result.data.guest.name;
        connectedAt.textContent = dateFormatter.format(new Date(result.data.guest.timestamp));
        supportCopy.textContent = `Need help? Contact ${result.data.support.receptionExtension} at ${result.data.support.hotelName}.`;
        renderInstructions(stepsList, Array.isArray(result.data.instructions) ? result.data.instructions : []);

        formPanel.classList.add("hidden");
        successPanel.classList.remove("hidden");
        successPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        form.reset();
      } catch (error) {
        showAlert(alertBox, error.message);
      } finally {
        setButtonLoading(submitButton, false);
      }
    });

    resetButton.addEventListener("click", () => {
      successPanel.classList.add("hidden");
      formPanel.classList.remove("hidden");
      hideAlert(alertBox);
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(passwordElement.textContent.trim());
        copyButton.textContent = "Password copied";
        window.setTimeout(() => {
          copyButton.textContent = "Copy password";
        }, 1800);
      } catch (error) {
        copyButton.textContent = "Copy unavailable";
        window.setTimeout(() => {
          copyButton.textContent = "Copy password";
        }, 1800);
      }
    });
  }

  function initializeAdminDashboard() {
    const dashboard = document.querySelector("[data-admin-dashboard]");

    if (!dashboard) {
      return;
    }

    const authForm = document.querySelector("[data-admin-auth-form]");
    const keyInput = authForm.querySelector('input[name="adminKey"]');
    const errorBox = document.querySelector("[data-admin-error]");
    const refreshButton = document.querySelector("[data-admin-refresh]");
    const clearKeyButton = document.querySelector("[data-admin-clear-key]");
    const tableBody = document.querySelector("[data-users-table-body]");
    const totalUsersElement = document.querySelector("[data-total-users]");
    const latestSignupElement = document.querySelector("[data-latest-signup]");
    const syncStatusElement = document.querySelector("[data-sync-status]");
    const pageIndicator = document.querySelector("[data-page-indicator]");
    const previousButton = document.querySelector("[data-page-previous]");
    const nextButton = document.querySelector("[data-page-next]");
    const resultsSummary = document.querySelector("[data-results-summary]");

    let adminKey = "";
    let currentRequestController = null;
    const state = {
      page: 1,
      totalPages: 1,
      pageSize: 25,
      totalUsers: 0,
    };

    authForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      adminKey = keyInput.value.trim();
      state.page = 1;

      await loadUsers();
    });

    refreshButton.addEventListener("click", loadUsers);
    previousButton.addEventListener("click", () => {
      if (state.page > 1) {
        state.page -= 1;
        loadUsers();
      }
    });
    nextButton.addEventListener("click", () => {
      if (state.page < state.totalPages) {
        state.page += 1;
        loadUsers();
      }
    });

    clearKeyButton.addEventListener("click", async () => {
      adminKey = "";
      keyInput.value = "";
      state.page = 1;
      await loadUsers();
    });

    updatePagination();
    loadUsers();

    async function loadUsers() {
      if (currentRequestController) {
        currentRequestController.abort();
      }

      const requestController = new AbortController();
      currentRequestController = requestController;
      refreshButton.disabled = true;
      refreshButton.textContent = "Refreshing...";
      syncStatusElement.textContent = "Syncing";
      hideAlert(errorBox);
      renderPlaceholder(tableBody, "Loading guest records...");
      updatePagination(true);

      try {
        const headers = adminKey
          ? { Accept: "application/json", "x-admin-key": adminKey }
          : { Accept: "application/json" };
        const query = new URLSearchParams({
          page: String(state.page),
        });
        const response = await fetch(`/api/users?${query.toString()}`, {
          headers,
          signal: requestController.signal,
        });
        const result = await parseJsonResponse(response);

        if (response.status === 401) {
          state.page = 1;
          state.totalUsers = 0;
          state.totalPages = 1;
          totalUsersElement.textContent = "--";
          latestSignupElement.textContent = "Access required";
          syncStatusElement.textContent = "Locked";
          resultsSummary.textContent = "Admin access key required.";
          renderPlaceholder(tableBody, "Enter the admin access key to view guest records.");
          showAlert(errorBox, result.message || "Enter the admin access key to continue.");
          updatePagination();
          return;
        }

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to fetch guest records.");
        }

        const users = Array.isArray(result.data?.users) ? result.data.users : [];
        renderUsers(tableBody, users);
        state.totalUsers = Number(result.meta?.totalUsers) || users.length;
        state.totalPages = Math.max(1, Number(result.meta?.totalPages) || 1);
        state.pageSize = Number(result.meta?.pageSize) || state.pageSize;
        state.page = Math.min(state.page, state.totalPages);
        totalUsersElement.textContent = String(state.totalUsers);
        latestSignupElement.textContent = result.meta?.latestSignup
          ? dateFormatter.format(new Date(result.meta.latestSignup))
          : "No sign-ins yet";
        syncStatusElement.textContent = "Live";
        resultsSummary.textContent = buildResultsSummary(
          state.page,
          state.pageSize,
          state.totalUsers,
          users.length,
        );
        updatePagination();
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        state.totalUsers = 0;
        state.totalPages = 1;
        state.page = 1;
        totalUsersElement.textContent = "0";
        latestSignupElement.textContent = "Unavailable";
        syncStatusElement.textContent = "Attention needed";
        resultsSummary.textContent = "Unable to load guest records.";
        renderPlaceholder(tableBody, "No guest records available yet.");
        showAlert(errorBox, error.message);
        updatePagination();
      } finally {
        if (currentRequestController === requestController) {
          currentRequestController = null;
          refreshButton.disabled = false;
          refreshButton.textContent = "Refresh";
        }
      }
    }

    function updatePagination(isLoading = false) {
      pageIndicator.textContent = `Page ${state.page} of ${state.totalPages}`;
      previousButton.disabled = isLoading || state.page <= 1;
      nextButton.disabled = isLoading || state.page >= state.totalPages;
    }
  }

  function renderInstructions(listElement, instructions) {
    listElement.innerHTML = "";

    instructions.forEach((instruction) => {
      const item = document.createElement("li");
      item.textContent = instruction;
      listElement.appendChild(item);
    });
  }

  function renderUsers(tableBody, users) {
    if (!users.length) {
      renderPlaceholder(tableBody, "No guest sign-ins yet.");
      return;
    }

    tableBody.innerHTML = "";

    users.forEach((user) => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      const emailCell = document.createElement("td");
      const timeCell = document.createElement("td");

      nameCell.textContent = user.name;
      emailCell.textContent = user.email;
      timeCell.textContent = dateFormatter.format(new Date(user.timestamp));

      row.append(nameCell, emailCell, timeCell);
      tableBody.appendChild(row);
    });
  }

  function renderPlaceholder(tableBody, message) {
    tableBody.innerHTML = "";

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 3;
    cell.className = "placeholder-cell";
    cell.textContent = message;
    row.appendChild(cell);
    tableBody.appendChild(row);
  }

  function showAlert(element, message) {
    element.textContent = message;
    element.classList.remove("hidden");
  }

  function hideAlert(element) {
    element.textContent = "";
    element.classList.add("hidden");
  }

  function setButtonLoading(button, isLoading) {
    button.disabled = isLoading;
    button.classList.toggle("is-loading", isLoading);
    const label = button.querySelector(".button-label");

    if (label) {
      label.textContent = isLoading ? "Connecting..." : "Connect to Wi-Fi";
    }
  }

  function getDeviceLabel() {
    const userAgent = navigator.userAgent;
    const platform = navigator.userAgentData?.platform || navigator.platform || "Unknown OS";

    let deviceType = "Desktop";
    if (/iPad|Tablet/i.test(userAgent)) {
      deviceType = "Tablet";
    } else if (/Mobi|Android|iPhone|iPod/i.test(userAgent)) {
      deviceType = "Mobile";
    }

    let browser = "Browser";
    if (/Edg/i.test(userAgent)) {
      browser = "Edge";
    } else if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) {
      browser = "Chrome";
    } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
      browser = "Safari";
    } else if (/Firefox/i.test(userAgent)) {
      browser = "Firefox";
    }

    return `${deviceType} | ${platform} | ${browser}`;
  }

  async function parseJsonResponse(response) {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error("Server returned an invalid response.");
    }
  }

  function validateGuestPayload(payload) {
    if (payload.website) {
      return "Invalid submission.";
    }

    if (payload.name.length < 2 || payload.name.length > 80) {
      return "Full name must be between 2 and 80 characters.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) || payload.email.length > 120) {
      return "Please provide a valid email address.";
    }

    return "";
  }

  function buildResultsSummary(page, pageSize, totalUsers, currentCount) {
    if (totalUsers === 0 || currentCount === 0) {
      return "No guest records available.";
    }

    const start = (page - 1) * pageSize + 1;
    const end = start + currentCount - 1;
    return `Showing ${start}-${end} of ${totalUsers} guest records.`;
  }

})();
