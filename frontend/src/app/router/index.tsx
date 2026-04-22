import { useState } from "react";
import {
  Navigate,
  RouteObject,
  RouterProvider,
  createBrowserRouter
} from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { ClassDetailPage } from "@/pages/class-detail-page";
import { ClassesPage } from "@/pages/classes-page";
import { EmailsPage } from "@/pages/emails-page";
import { ExamBankPage } from "@/pages/exam-bank-page";
import { ExamDashboardPage } from "@/pages/exam-dashboard-page";
import { ExamWizardPage } from "@/pages/exam-wizard-page";
import { GoalsPage } from "@/pages/goals-page";
import { GradingPage } from "@/pages/grading-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { QuestionsPage } from "@/pages/questions-page";
import { StudentProfilePage } from "@/pages/student-profile-page";
import { StudentsPage } from "@/pages/students-page";

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
        path: "exam-bank",
        element: <ExamBankPage />
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
        path: "students",
        element: <StudentsPage />
      },
      {
        path: "students/:studentId",
        element: <StudentProfilePage />
      },
      {
        path: "goals",
        element: <GoalsPage />
      },
      {
        path: "classes",
        element: <ClassesPage />
      },
      {
        path: "classes/:classId",
        element: <ClassDetailPage />
      },
      {
        path: "emails",
        element: <EmailsPage />
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
