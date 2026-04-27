import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import { EmailsPage } from "@/pages/emails-page";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/classes/hooks", () => ({
  useClassGroups: () => ({
    data: [
      {
        id: "class-1",
        topic: "Turma Alfa",
        year: 2026,
        semester: 1,
        studentIds: ["student-1"],
        goalIds: [],
        createdAt: "2026-04-22T10:00:00.000Z",
        updatedAt: "2026-04-22T10:00:00.000Z"
      }
    ]
  })
}));

vi.mock("@/features/emails/hooks", () => ({
  useEmailLogs: () => ({
    data: [
      {
        id: "email-1",
        studentId: "student-1",
        studentName: "Ana Souza",
        to: "ana@example.com",
        subject: "Resumo diário das suas avaliações — 2026-04-22",
        text: "Olá, Ana Souza.\n\nAs seguintes avaliações foram registradas ou atualizadas hoje:",
        digestDate: "2026-04-22",
        classIds: ["class-1"],
        goalIds: ["goal-1", "goal-2"],
        entriesCount: 2,
        status: "sent",
        attemptedAt: "2026-04-22T10:00:00.000Z"
      }
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false
  }),
  useSendManualEmail: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null
  })
}));

vi.mock("@/features/students/hooks", () => ({
  useStudents: () => ({
    data: [
      {
        id: "student-1",
        name: "Ana Souza",
        cpf: "52998224725",
        email: "ana@example.com",
        createdAt: "2026-04-22T10:00:00.000Z",
        updatedAt: "2026-04-22T10:00:00.000Z"
      }
    ]
  })
}));

describe("EmailsPage", () => {
  it("renders the manual composer and sent email history for teachers", async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/emails"]}>
        <Routes>
          <Route path="/emails" element={<EmailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("E-mails")).toBeInTheDocument();
    expect(screen.getByText("Enviar e-mail para aluno ou turma")).toBeInTheDocument();
    expect(screen.getByText("Aluno individual")).toBeInTheDocument();
    expect(screen.getByText("Turma inteira")).toBeInTheDocument();
    expect(screen.getByText("Ana Souza")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByText("Enviado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ver e-mail/i })).toBeInTheDocument();
  });
});
