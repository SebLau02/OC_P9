/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../pages/Bills/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import { getBills, initBillsPage } from "../pages/Bills/Bills.js";
import store from "../__mocks__/store.js";
import storeError from "../__mocks__/store_error.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Expect data is empty Array when store null", async () => {
      const data = await getBills(null);
      expect(data).toEqual([]);
    });
    test("Expect data is empty Array when store undefined", async () => {
      const data = await getBills(undefined);
      expect(data).toEqual([]);
    });
    test("Expect page render elements with correct date", async () => {
      const snapshot = await getBills(store);
      expect(snapshot).toBeTruthy();
    });
    test("Expect page render elements with date not formated", async () => {
      const snapshot = await getBills(storeError);
      expect(snapshot).toBeTruthy();
      expect(snapshot[0].date).toBe("Not valid date format");
    });

    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        }),
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i,
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    test("Then, if I click on the new bill button, I should be navigated to the NewBill page", async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const btnNewBil = screen.getByTestId("btn-new-bill");
      const onNavigate = jest.fn();
      initBillsPage({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      userEvent.click(btnNewBil);
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });
    test("Then, if I click on the eye icon, the modal should open", async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const onNavigate = jest.fn();
      initBillsPage({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      const modaleFile = screen.getByTestId("modaleFile");
      const iconEyes = screen.getAllByTestId("icon-eye");
      for (const icon of iconEyes) {
        userEvent.click(icon);
        modaleFile.dispatchEvent(new Event("shown.bs.modal"));
        const billUrl = icon.getAttribute("data-bill-url");
        await waitFor(() => {
          const img = screen.getByTestId("bill-proof-image");
          expect(img).toBeTruthy();
          expect(img.getAttribute("src")).toBe(billUrl);
        });
      }
    });
  });
});
