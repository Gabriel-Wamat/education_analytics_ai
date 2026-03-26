import { Compass } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button, getButtonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <EmptyState
        icon={<Compass className="h-8 w-8" />}
        title="Página não encontrada"
        description="A rota informada não existe nesta versão da aplicação. Volte para as áreas operacionais principais."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => navigate("/questions")}>
              Ir para Questões
            </Button>
            <Link
              to="/grading"
              className={getButtonClassName({ variant: "secondary" })}
            >
              Ir para Correção
            </Link>
          </div>
        }
      />
    </div>
  );
};
