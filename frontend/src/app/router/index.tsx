import { useState } from "react";
import {
  Navigate,
  RouteObject,
  RouterProvider,
  createBrowserRouter
} from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { ExamDashboardPage } from "@/pages/exam-dashboard-page";
import { ExamWizardPage } from "@/pages/exam-wizard-page";
import { GradingPage } from "@/pages/grading-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { QuestionsPage } from "@/pages/questions-page";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate to="/questions" replace />
      },
      {
        path: "questions",
        element: <QuestionsPage />
      },
      {
        path: "exam-templates/new",
        element: <ExamWizardPage />
      },
      {
        path: "grading",
        element: <GradingPage />
      },
      {
        path: "dashboard",
        element: <ExamDashboardPage />
      },
      {
        path: "exams/:examId",
        element: <ExamDashboardPage />
      },
      {
        path: "*",
        element: <NotFoundPage />
      }
    ]
  }
];

export const AppRouter = () => {
  const [router] = useState(() => createBrowserRouter(appRoutes));
  return <RouterProvider router={router} />;
};
