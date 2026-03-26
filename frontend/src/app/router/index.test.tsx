import { screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import { renderWithProviders } from "@/test/utils";

vi.mock("@/pages/questions-page", () => ({
  QuestionsPage: () => <div>ROUTE_QUESTIONS_PAGE</div>
}));

vi.mock("@/pages/exam-wizard-page", () => ({
  ExamWizardPage: () => <div>ROUTE_EXAM_WIZARD_PAGE</div>
}));

vi.mock("@/pages/grading-page", () => ({
  GradingPage: () => <div>ROUTE_GRADING_PAGE</div>
}));

vi.mock("@/pages/exam-dashboard-page", () => ({
  ExamDashboardPage: () => <div>ROUTE_EXAM_DASHBOARD_PAGE</div>
}));

vi.mock("@/pages/not-found-page", () => ({
  NotFoundPage: () => <div>ROUTE_NOT_FOUND_PAGE</div>
}));

import { appRoutes } from "./index";

const renderRoute = (initialEntry: string) => {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialEntry]
  });

  return renderWithProviders(<RouterProvider router={router} />);
};

describe("AppRouter", () => {
  it("redirects / to /questions", async () => {
    renderRoute("/");

    expect(await screen.findByText("ROUTE_QUESTIONS_PAGE")).toBeInTheDocument();
  });

  it("maps /questions", async () => {
    renderRoute("/questions");
    expect(await screen.findByText("ROUTE_QUESTIONS_PAGE")).toBeInTheDocument();
  });

  it("maps /exam-templates/new", async () => {
    renderRoute("/exam-templates/new");
    expect(await screen.findByText("ROUTE_EXAM_WIZARD_PAGE")).toBeInTheDocument();
  });

  it("maps /grading", async () => {
    renderRoute("/grading");
    expect(await screen.findByText("ROUTE_GRADING_PAGE")).toBeInTheDocument();
  });

  it("maps /dashboard", async () => {
    renderRoute("/dashboard");
    expect(await screen.findByText("ROUTE_EXAM_DASHBOARD_PAGE")).toBeInTheDocument();
  });

  it("maps /exams/:examId", async () => {
    renderRoute("/exams/123");
    expect(await screen.findByText("ROUTE_EXAM_DASHBOARD_PAGE")).toBeInTheDocument();
  });

  it("maps unknown routes to not found", async () => {
    renderRoute("/nao-existe");
    expect(await screen.findByText("ROUTE_NOT_FOUND_PAGE")).toBeInTheDocument();
  });
});
