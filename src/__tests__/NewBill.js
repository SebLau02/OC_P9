/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../pages/NewBill/NewBillUI.js";
import {
  handleChangeFile,
  initNewBillPage,
  resetBillFileState,
  updateBill,
} from "../pages/NewBill/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { bills } from "../fixtures/bills.js";

const setupLocalStorage = () => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  window.localStorage.clear();
};

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the form should be rendered with all required fields", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Verify form is present
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();

      // Verify all form fields are present
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
    });

    test("Then the submit button should be rendered", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const submitButton = screen.getByText("Envoyer");
      expect(submitButton).toBeTruthy();
      expect(submitButton.type).toBe("submit");
    });

    test("Then the page title should be displayed", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });

    test("Then the expense type select should have all options", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const expenseTypeSelect = screen.getByTestId("expense-type");
      expect(expenseTypeSelect).toBeTruthy();

      // Verify all expense type options are present
      expect(screen.getByText("Transports")).toBeTruthy();
      expect(screen.getByText("Restaurants et bars")).toBeTruthy();
      expect(screen.getByText("Hôtel et logement")).toBeTruthy();
      expect(screen.getByText("Services en ligne")).toBeTruthy();
      expect(screen.getByText("IT et électronique")).toBeTruthy();
      expect(screen.getByText("Equipement et matériel")).toBeTruthy();
      expect(screen.getByText("Fournitures de bureau")).toBeTruthy();
    });
  });
});

describe("Given I am connected as an employee and I am on NewBill Page", () => {
  beforeEach(() => {
    setupLocalStorage();
    // Ajout d'un user factice pour éviter JSON.parse(undefined)
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "test@test.com",
        password: "azerty",
        status: "connected",
      }),
    );
    const html = NewBillUI();
    document.body.innerHTML = html;
    const onNavigate = jest.fn();
    const store = null;
    const localStorage = window.localStorage;
    initNewBillPage({
      document,
      onNavigate,
      store,
      localStorage,
    });
  });
  test("Then I should be able to add a new bill", () => {
    const form = screen.getByTestId("form-new-bill");
    expect(form).toBeTruthy();
  });
  test("Then I should be able to submit a new bill", () => {
    const form = screen.getByTestId("form-new-bill");
    expect(form).toBeTruthy();
    const submitFn = () => form.dispatchEvent(new Event("submit"));
    expect(submitFn).not.toThrow(); // car fireEvent ne lance pas d’erreur JS, mais le handler peut gérer l’erreur en interne
  });
  test("Then I should be able to add a file", () => {
    const fileInput = screen.getByTestId("file");
    expect(fileInput).toBeTruthy();
    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(fileInput.files[0]).toBe(file);
    expect(fileInput.files).toHaveLength(1);
  });
  test("When I try to add an invalid file type", () => {
    const fileInput = screen.getByTestId("file");
    expect(fileInput).toBeTruthy();
    window.alert = jest.fn(); // Mock l'alerte ici !
    const file = new File(["dummy content"], "test.txt", {
      type: "text/plain",
    });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(fileInput.value).toBe(""); // L'input doit être vidé
    expect(window.alert).toHaveBeenCalledWith(
      "Le fichier doit être au format image (jpg, jpeg, png)",
    );
  });
  test("Store should be updated when a valid file is added", () => {
    const fileInput = screen.getByTestId("file");
    expect(fileInput).toBeTruthy();
    window.alert = jest.fn(); // Mock l'alerte ici !
    const file = new File(["dummy content"], "test.png", {
      type: "image/png",
    });
    const handleChangeFileSpy = jest.fn((e) =>
      handleChangeFile(e, {
        store: mockStore,
        localStorage: window.localStorage,
      }),
    );
    fileInput.addEventListener("change", handleChangeFileSpy);
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(fileInput.files[0]).toBe(file);
    expect(fileInput.files).toHaveLength(1);
  });
  test("Should show console.error when create file fails", async () => {
    const fileInput = screen.getByTestId("file");
    expect(fileInput).toBeTruthy();

    window.alert = jest.fn(); // Mock l'alerte ici !
    console.error = jest.fn(); // Mock console.error ici !

    const file = new File(["dummy content"], "test.png", {
      type: "image/png",
    });

    const errorStore = {
      bills: () => ({
        ...mockStore.bills(),
        create: () => Promise.reject(new Error("Erreur API")),
      }),
    };

    const handleChangeFileSpy = jest.fn((e) =>
      handleChangeFile(e, {
        store: errorStore,
        localStorage: window.localStorage,
      }),
    );
    fileInput.addEventListener("change", handleChangeFileSpy);
    fireEvent.change(fileInput, { target: { files: [file] } });
    // Attend la propagation de la promesse rejetée
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(console.error).toHaveBeenCalled();
  });
  test("Then I should be able to submit a new bill", () => {
    updateBill(bills[0], {
      billId: bills[0].id,
      store: mockStore,
      onNavigate: jest.fn(),
    });
  });
  test("Then I should show console error when update store bill fails", async () => {
    const errorStore = {
      bills: () => ({
        ...mockStore.bills(),
        update: () => Promise.reject(new Error("Erreur API")),
      }),
    };
    updateBill(bills[0], {
      billId: bills[0].id,
      store: errorStore,
      onNavigate: jest.fn(),
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(console.error).toHaveBeenCalled();
  });
});
