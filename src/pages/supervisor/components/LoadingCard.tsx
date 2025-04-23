
import { Card, CardContent } from "@/components/ui/card";

export function LoadingCard() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando...</div>
        </CardContent>
      </Card>
    </div>
  );
}
