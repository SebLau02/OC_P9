/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import DashboardFormUI from "../pages/Dashboard/DashboardFormUI.js";
import DashboardUI from "../pages/Dashboard/DashboardUI.js";
import {
  filteredBills,
  cards,
  initDashboardPage,
  handleShowTickets,
  handleEditTicket,
  handleAcceptSubmit,
  handleRefuseSubmit,
  handleClickIconEye,
  resetDashboardState,
  card,
  getBillsAllUsers,
  updateBill,
} from "../pages/Dashboard/Dashboard.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { bills } from "../fixtures/bills";
import router from "../app/Router";

jest.mock("../app/store", () => mockStore);

//Helper Functions

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

const setupLocalStorage = () => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Admin",
    }),
  );
};

describe("Given I am connected as an Admin", () => {
  describe("On loading Dashboard page", () => {
    test("It should fetch bills from the store", async () => {
      const storedBills = await getBillsAllUsers(mockStore);
      const bill = bills[0];
      const storedBill = storedBills[0];
      expect(storedBills.length).toBe(bills.length);
      expect(storedBill.id).toBe(bill.id);
    });
    test("It should return empty Array when fetching from null store", async () => {
      const storedBills = await getBillsAllUsers(null);
      expect(storedBills.length).toBe(0);
    });
  });
  describe("When I submited form", () => {
    test("It should update store", async () => {
      const updatedBill = { ...bills[0], commentAdmin: "Changed" };
      const updatedStoredBill = await updateBill(updatedBill, mockStore);
      expect(updatedStoredBill.commentAdmin).toBe("Changed");
    });
    test("It should throw an error when updating with incomplete bill data", async () => {
      const updatedBill = { ...bills[0], commentAdmin: "Changed" };
      const { id, ...restBill } = updatedBill;
      await expect(updateBill(restBill, mockStore)).rejects.toThrow("Error");
    });
  });
  describe("When I am on Dashboard page", () => {
    // Fais par moi
    test("Then, each card should render with the part before the @ in the email as the name", () => {
      const cardEl = card({
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl:
          "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        name: "encore",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2022-01-01",
        amount: 400,
        commentAdmin: "ok",
        email: "firstnamelastname@a",
        pct: 20,
      });
      document.body.innerHTML = cardEl;

      expect(document.querySelector(".bill-card-name").textContent).toBe(
        "  firstnamelastname ",
      );
    });
    test("Then, each card should render with the correct firstname and lastname", () => {
      const cardEl = card({
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl:
          "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        name: "encore",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2022-01-01",
        amount: 400,
        commentAdmin: "ok",
        email: "firstname.lastname@a",
        pct: 20,
      });
      document.body.innerHTML = cardEl;

      expect(document.querySelector(".bill-card-name").textContent).toBe(
        " firstname lastname ",
      );
    });
    test("Then, Dashboard page should be empty", () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      const dashboard = initDashboardPage({
        document: null,
        onNavigate,
        bills,
        localStorage: localStorageMock,
      });
      expect(dashboard).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith("Dashboard: document is MISSING");
      consoleSpy.mockRestore();
    });
    test("Then, pending bills should be render on click on pending icon", () => {
      document.body.innerHTML = DashboardUI({ data: { bills } });

      initDashboardPage({
        document,
        onNavigate,
        bills,
        localStorage: localStorageMock,
      });
      const icon1 = screen.getByTestId("arrow-icon1");
      expect(icon1).toBeTruthy();
      userEvent.click(icon1);
      const ticketName = screen.getByText("encore");
      expect(ticketName).toBeTruthy();
    });
    test("Then, accepted bills should be render on click on accepted icon", () => {
      document.body.innerHTML = DashboardUI({ data: { bills } });

      initDashboardPage({
        document,
        onNavigate,
        bills,
        localStorage: localStorageMock,
      });
      const icon = screen.getByTestId("arrow-icon2");
      expect(icon).toBeTruthy();
      userEvent.click(icon);
      const ticketName = screen.getByText("test3");
      expect(ticketName).toBeTruthy();
    });
    test("Then, refused bills should be render on click on refused icon", () => {
      document.body.innerHTML = DashboardUI({ data: { bills } });

      initDashboardPage({
        document,
        onNavigate,
        bills,
        localStorage: localStorageMock,
      });
      const icon = screen.getByTestId("arrow-icon3");
      expect(icon).toBeTruthy();
      userEvent.click(icon);
      const ticketName = screen.getByText("test1");
      expect(ticketName).toBeTruthy();
    });
    test("Then, i can toggle bills side menu", () => {
      document.body.innerHTML = DashboardUI({ data: { bills } });

      initDashboardPage({
        document,
        onNavigate,
        bills,
        localStorage: localStorageMock,
      });
      const icon1 = screen.getByTestId("arrow-icon1");
      expect(icon1).toBeTruthy();
      userEvent.click(icon1);
      expect(icon1.style.transform).toBe("rotate(0deg)");
      userEvent.click(icon1);
      expect(icon1.style.transform).toBe("rotate(90deg)");
    });
  });
  // Fin Fais par moi

  describe("When I am on Dashboard page, there are bills, and there is one pending", () => {
    test("Then, filteredBills by pending status should return 1 bill", () => {
      const filtered_bills = filteredBills(bills, "pending");
      expect(filtered_bills.length).toBe(1);
    });
  });
  describe("When I am on Dashboard page, there are bills, and there is one accepted", () => {
    test("Then, filteredBills by accepted status should return 1 bill", () => {
      const filtered_bills = filteredBills(bills, "accepted");
      expect(filtered_bills.length).toBe(1);
    });
  });
  describe("When I am on Dashboard page, there are bills, and there is two refused", () => {
    test("Then, filteredBills by accepted status should return 2 bills", () => {
      const filtered_bills = filteredBills(bills, "refused");
      expect(filtered_bills.length).toBe(2);
    });
  });
  describe("When I am on Dashboard page but it is loading", () => {
    test("Then, Loading page should be rendered", () => {
      document.body.innerHTML = DashboardUI({ loading: true });
      expect(screen.getAllByText("Loading...")).toBeTruthy();
    });
  });
  describe("When I am on Dashboard page but back-end send an error message", () => {
    test("Then, Error page should be rendered", () => {
      document.body.innerHTML = DashboardUI({ error: "some error message" });
      expect(screen.getAllByText("Erreur")).toBeTruthy();
    });
  });

  describe("When I am on Dashboard page and I click on arrow", () => {
    test("Then, tickets list should be unfolding, and cards should appear", async () => {
      setupLocalStorage();
      resetDashboardState();

      document.body.innerHTML = DashboardUI({ data: { bills } });

      const handleShowTickets1 = jest.fn((e) =>
        handleShowTickets(e, bills, 1, document),
      );
      const handleShowTickets2 = jest.fn((e) =>
        handleShowTickets(e, bills, 2, document),
      );
      const handleShowTickets3 = jest.fn((e) =>
        handleShowTickets(e, bills, 3, document),
      );

      const icon1 = screen.getByTestId("arrow-icon1");
      const icon2 = screen.getByTestId("arrow-icon2");
      const icon3 = screen.getByTestId("arrow-icon3");

      icon1.addEventListener("click", handleShowTickets1);
      userEvent.click(icon1);
      expect(handleShowTickets1).toHaveBeenCalled();
      await waitFor(() => screen.getByTestId(`open-bill47qAXb6fIm2zOKkLzMro`));
      expect(screen.getByTestId(`open-bill47qAXb6fIm2zOKkLzMro`)).toBeTruthy();

      icon2.addEventListener("click", handleShowTickets2);
      userEvent.click(icon2);
      expect(handleShowTickets2).toHaveBeenCalled();
      await waitFor(() => screen.getByTestId(`open-billUIUZtnPQvnbFnB0ozvJh`));
      expect(screen.getByTestId(`open-billUIUZtnPQvnbFnB0ozvJh`)).toBeTruthy();

      icon3.addEventListener("click", handleShowTickets3);
      userEvent.click(icon3);
      expect(handleShowTickets3).toHaveBeenCalled();
      await waitFor(() => screen.getByTestId(`open-billBeKy5Mo4jkmdfPGYpTxZ`));
      expect(screen.getByTestId(`open-billBeKy5Mo4jkmdfPGYpTxZ`)).toBeTruthy();
    });
  });

  describe("When I am on Dashboard page and I click on edit icon of a card", () => {
    test("Then, i can add commmentary and accept the bill", () => {
      setupLocalStorage();
      resetDashboardState();

      document.body.innerHTML = DashboardUI({ data: { bills } });

      const handleShowTickets1 = jest.fn((e) =>
        handleShowTickets(e, bills, 1, document),
      );
      const icon1 = screen.getByTestId("arrow-icon1");
      icon1.addEventListener("click", handleShowTickets1);
      userEvent.click(icon1);
      expect(handleShowTickets1).toHaveBeenCalled();
      expect(screen.getByTestId(`open-bill${bills[0].id}`)).toBeTruthy();
      const iconEdit = screen.getByTestId(`open-bill${bills[0].id}`);
      userEvent.click(iconEdit);
      expect(screen.getByTestId(`dashboard-form`)).toBeTruthy();
      const commentaryInput = screen.getByTestId("commentary2");
      expect(commentaryInput).toBeTruthy();
      fireEvent.change(commentaryInput, {
        target: { value: "Mon commentaire" },
      });
      const acceptButton = screen.getByTestId("btn-accept-bill-d");
      expect(acceptButton).toBeTruthy();
      userEvent.click(acceptButton);
      expect(commentaryInput.value).toBe("Mon commentaire");
      expect(screen.queryByTestId("big-billed-icon")).toBeTruthy();
    });
    test("Then, i can add commmentary and refuse the bill", () => {
      setupLocalStorage();
      resetDashboardState();

      document.body.innerHTML = DashboardUI({ data: { bills } });

      const handleShowTickets1 = jest.fn((e) =>
        handleShowTickets(e, bills, 1, document),
      );
      const icon1 = screen.getByTestId("arrow-icon1");
      icon1.addEventListener("click", handleShowTickets1);
      userEvent.click(icon1);
      expect(handleShowTickets1).toHaveBeenCalled();
      expect(screen.getByTestId(`open-bill${bills[0].id}`)).toBeTruthy();
      const iconEdit = screen.getByTestId(`open-bill${bills[0].id}`);
      userEvent.click(iconEdit);
      expect(screen.getByTestId(`dashboard-form`)).toBeTruthy();
      const commentaryInput = screen.getByTestId("commentary2");
      expect(commentaryInput).toBeTruthy();
      fireEvent.change(commentaryInput, {
        target: { value: "Mon commentaire" },
      });
      const refuseButton = screen.getByTestId("btn-refuse-bill-d");
      expect(refuseButton).toBeTruthy();
      userEvent.click(refuseButton);
      expect(commentaryInput.value).toBe("Mon commentaire");
      expect(screen.queryByTestId("big-billed-icon")).toBeTruthy();
    });
    test("Then, modal should be open with attached file displayed on click on eye icon", async () => {
      setupLocalStorage();
      resetDashboardState();

      document.body.innerHTML = DashboardUI({ data: { bills } });

      const handleShowTickets1 = jest.fn((e) =>
        handleShowTickets(e, bills, 1, document),
      );
      const icon1 = screen.getByTestId("arrow-icon1");
      icon1.addEventListener("click", handleShowTickets1);
      userEvent.click(icon1);
      const iconEdit = screen.getByTestId("open-bill47qAXb6fIm2zOKkLzMro");
      userEvent.click(iconEdit);
      const eyeIcon = screen.getByTestId("icon-eye-d");
      userEvent.click(eyeIcon);
      const modal = screen.getByTestId("modaleFileAdmin");

      modal.dispatchEvent(new Event("shown.bs.modal"));
      const billUrl = eyeIcon.getAttribute("data-bill-url");
      await waitFor(() => {
        const img = screen.getByTestId("bill-proof-image");
        expect(img).toBeTruthy();
        expect(img.getAttribute("src")).toBe(billUrl);
      });
    });
    test("Then, form should be submit on click on Accept button", async () => {
      setupLocalStorage();
      resetDashboardState();
      document.body.innerHTML = DashboardFormUI(bills[0]);

      const acceptButton = screen.getByTestId("btn-accept-bill-d");

      acceptButton.addEventListener("click", (e) =>
        handleAcceptSubmit(e, bills[0], document),
      );
      fireEvent.click(acceptButton);
      const bigBilledIcon = screen.queryByTestId("big-billed-icon");
      expect(bigBilledIcon).toBeTruthy();
      expect(screen.getByTestId(`commentary2`)).toBeTruthy();
    });
  });

  describe("When I am on Dashboard page and I click 2 times on edit icon of a card", () => {
    test("Then, big bill Icon should Appear", () => {
      setupLocalStorage();
      resetDashboardState();

      document.body.innerHTML = DashboardUI({ data: { bills } });

      const handleShowTickets1 = jest.fn((e) =>
        handleShowTickets(e, bills, 1, document),
      );
      const icon1 = screen.getByTestId("arrow-icon1");
      icon1.addEventListener("click", handleShowTickets1);
      userEvent.click(icon1);
      expect(handleShowTickets1).toHaveBeenCalled();
      expect(screen.getByTestId(`open-bill47qAXb6fIm2zOKkLzMro`)).toBeTruthy();
      const iconEdit = screen.getByTestId("open-bill47qAXb6fIm2zOKkLzMro");
      userEvent.click(iconEdit);
      userEvent.click(iconEdit);
      const bigBilledIcon = screen.queryByTestId("big-billed-icon");
      expect(bigBilledIcon).toBeTruthy();
    });
  });

  describe("When I am on Dashboard and there are no bills", () => {
    test("Then, no cards should be shown", () => {
      document.body.innerHTML = cards([]);
      const iconEdit = screen.queryByTestId("open-bill47qAXb6fIm2zOKkLzMro");
      expect(iconEdit).toBeNull();
    });
  });
});

describe("Given I am connected as Admin, and I am on Dashboard page, and I clicked on a pending bill", () => {
  describe("When I click on accept button", () => {
    test("I should be sent on Dashboard with big billed icon instead of form", () => {
      setupLocalStorage();
      resetDashboardState();
      document.body.innerHTML = DashboardFormUI(bills[0]);

      const acceptButton = screen.getByTestId("btn-accept-bill-d");
      const handleAcceptSubmitWrapped = jest.fn((e) =>
        handleAcceptSubmit(e, bills[0], document),
      );
      acceptButton.addEventListener("click", handleAcceptSubmitWrapped);
      fireEvent.click(acceptButton);
      expect(handleAcceptSubmitWrapped).toHaveBeenCalled();
      const bigBilledIcon = screen.queryByTestId("big-billed-icon");
      expect(bigBilledIcon).toBeTruthy();
    });
  });
  describe("When I click on refuse button", () => {
    test("I should be sent on Dashboard with big billed icon instead of form", () => {
      setupLocalStorage();
      resetDashboardState();
      document.body.innerHTML = DashboardFormUI(bills[0]);

      const refuseButton = screen.getByTestId("btn-refuse-bill-d");
      const handleRefuseSubmitWrapped = jest.fn((e) =>
        handleRefuseSubmit(e, bills[0], document),
      );
      refuseButton.addEventListener("click", handleRefuseSubmitWrapped);
      fireEvent.click(refuseButton);
      expect(handleRefuseSubmitWrapped).toHaveBeenCalled();
      const bigBilledIcon = screen.queryByTestId("big-billed-icon");
      expect(bigBilledIcon).toBeTruthy();
    });
  });
});

describe("Given I am connected as Admin and I am on Dashboard page and I clicked on a bill", () => {
  describe("When I click on the icon eye", () => {
    test("A modal should open", () => {
      setupLocalStorage();
      resetDashboardState();
      document.body.innerHTML = DashboardFormUI(bills[0]);

      const handleClickIconEyeWrapped = jest.fn(() =>
        handleClickIconEye(document),
      );
      const eye = screen.getByTestId("icon-eye-d");
      eye.addEventListener("click", handleClickIconEyeWrapped);
      userEvent.click(eye);
      expect(handleClickIconEyeWrapped).toHaveBeenCalled();

      const modale = screen.getByTestId("modaleFileAdmin");
      expect(modale).toBeTruthy();
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as Admin", () => {
  describe("When I navigate to Dashboard", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Admin", email: "a@a" }),
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Dashboard);
      await waitFor(() => screen.getByText("Validations"));
      const contentPending = await screen.getByText("En attente (1)");
      expect(contentPending).toBeTruthy();
      const contentRefused = await screen.getByText("Refusé (2)");
      expect(contentRefused).toBeTruthy();
      expect(screen.getByTestId("big-billed-icon")).toBeTruthy();
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Admin",
            email: "a@a",
          }),
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Dashboard);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Dashboard);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
