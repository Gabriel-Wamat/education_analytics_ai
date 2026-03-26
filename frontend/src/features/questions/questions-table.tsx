import { FilePenLine, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, truncateText } from "@/lib/formatters";
import { Question } from "@/types/api";
import { formatQuestionUnit } from "./metadata";

interface QuestionsTableProps {
  questions: Question[];
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void;
}

export const QuestionsTable = ({
  questions,
  onEdit,
  onDelete
}: QuestionsTableProps) => (
  <Table className="min-w-[1180px]">
    <TableHead>
      <tr>
        <TableHeaderCell className="w-[36%]">Questão</TableHeaderCell>
        <TableHeaderCell className="w-[20%]">Tema</TableHeaderCell>
        <TableHeaderCell className="w-[10%]">Unidade</TableHeaderCell>
        <TableHeaderCell className="w-[8%]">Alternativas</TableHeaderCell>
        <TableHeaderCell className="w-[8%]">Corretas</TableHeaderCell>
        <TableHeaderCell className="w-[12%]">Atualizada</TableHeaderCell>
        <TableHeaderCell className="w-[16%] text-right">Ações</TableHeaderCell>
      </tr>
    </TableHead>
    <TableBody>
      {questions.map((question) => (
        <TableRow key={question.id}>
          <TableCell className="pr-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 shadow-sm">
                Q
              </div>
              <div className="min-w-0">
                <div className="max-w-[460px] text-[15px] font-semibold leading-7 text-slate-800">
                  {truncateText(question.statement, 110)}
                </div>
              </div>
            </div>
          </TableCell>
          <TableCell className="pr-4">
            <StatusBadge
              tone="info"
              className="max-w-[260px] truncate whitespace-nowrap"
              title={question.topic}
            >
              {truncateText(question.topic, 42)}
            </StatusBadge>
          </TableCell>
          <TableCell>
            <StatusBadge
              tone="warning"
              className="max-w-[140px] truncate whitespace-nowrap"
              title={formatQuestionUnit(question.unit)}
            >
              {formatQuestionUnit(question.unit)}
            </StatusBadge>
          </TableCell>
          <TableCell className="font-medium text-slate-600">{question.options.length}</TableCell>
          <TableCell className="font-medium text-slate-600">
            {question.options.filter((option) => option.isCorrect).length}
          </TableCell>
          <TableCell className="text-slate-600">{formatDateTime(question.updatedAt)}</TableCell>
          <TableCell className="pl-4">
            <div className="flex justify-end gap-2 whitespace-nowrap">
              <Button variant="secondary" size="sm" onClick={() => onEdit(question)}>
                <FilePenLine className="h-4 w-4" />
                Editar
              </Button>
              <Button variant="danger" size="sm" onClick={() => onDelete(question)}>
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
