import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { SendExamBatchModal } from "@/features/exam-batches/send-exam-batch-modal";
import { renderWithProviders } from "@/test/utils";

const mutateAsync = vi.fn().mockResolvedValue({
  batchId: "batch-1",
  classId: "class-1",
  classLabel: "Turma Alfa (2026.1)",
  studentsTargeted: 2,
  proofsAvailable: 3,
  emailsSent: 2,
  emailsFailed: 0,
  assignments: [
    {
      studentId: "student-1",
      studentName: "Ana Souza",
      studentEmail: "ana@example.com",
      examCode: "EXAM-001",
      artifactId: "pdf--batch-1--instance-1",
      downloadUrl: "/api/exam-batches/artifacts/pdf--batch-1--instance-1/download",
      sent: true
    }
  ]
});

vi.mock("@/features/classes/hooks", () => ({
  useClassGroups: () => ({
    data: [
      {
        id: "class-1",
        topic: "Turma Alfa",
        year: 2026,
        semester: 1,
        studentIds: ["student-1", "student-2"],
        goalIds: [],
        createdAt: "2026-04-22T00:00:00.000Z",
        updatedAt: "2026-04-22T00:00:00.000Z"
      }
    ],
    isLoading: false,
    isError: false,
    error: null
  })
}));

vi.mock("@/features/exam-templates/hooks", () => ({
  useSendExamBatchToClass: () => ({
    mutateAsync,
    isPending: false
  })
}));

describe("SendExamBatchModal", () => {
  it("sends a batch to the selected class and renders the result summary", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <SendExamBatchModal
        open
        onClose={vi.fn()}
        batchId="batch-1"
        proofsAvailable={3}
      />
    );

    expect(screen.getByText("Enviar lote por e-mail")).toBeInTheDocument();
    expect(screen.getByText("Turma Alfa")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /enviar para turma/i }));

    expect(mutateAsync).toHaveBeenCalledWith({ classId: "class-1" });
    expect(await screen.findByText("Envio concluído")).toBeInTheDocument();
    expect(screen.getByText("Ana Souza")).toBeInTheDocument();
    expect(screen.getByText(/prova atribu[ií]da:\s*EXAM-001/i)).toBeInTheDocument();
  });
});
