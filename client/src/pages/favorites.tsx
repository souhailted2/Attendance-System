import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavorites } from "@/hooks/use-favorites";
import { Star, Users as UsersIcon, ClipboardList, Hash, Building2 } from "lucide-react";
import type { Employee, Workshop, Position } from "@shared/schema";

export default function Favorites() {
  const { favorites, toggleFavorite } = useFavorites();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });
  const { data: workshops = [] } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: positions = [] } = useQuery<Position[]>({ queryKey: ["/api/positions"] });

  const favoriteEmployees = employees.filter((e) => favorites.includes(e.id));

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
          المفضلة
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          الموظفون المفضلون — وصول سريع لسجلات حضورهم
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : favoriteEmployees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-3">
            <Star className="h-14 w-14 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">لا يوجد موظفون في المفضلة</p>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              اذهب إلى صفحة الموظفين واضغط على أيقونة النجمة ⭐ بجانب أي موظف لإضافته هنا
            </p>
            <Link href="/employees">
              <Button variant="outline" className="mt-2" data-testid="link-go-employees">
                <UsersIcon className="h-4 w-4 ml-2" />
                الذهاب إلى الموظفين
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteEmployees.map((emp) => {
            const workshop = workshops.find((w) => w.id === emp.workshopId);
            const position = positions.find((p) => p.id === emp.positionId);
            return (
              <Card key={emp.id} data-testid={`card-favorite-${emp.id}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">{emp.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" data-testid={`text-fav-name-${emp.id}`}>{emp.name}</p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Hash className="h-3 w-3" />{emp.employeeCode}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => toggleFavorite(emp.id)}
                      data-testid={`button-remove-fav-${emp.id}`}
                      title="إزالة من المفضلة"
                    >
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {workshop && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Building2 className="h-3 w-3" />{workshop.name}
                      </Badge>
                    )}
                    {position && (
                      <Badge variant="outline" className="text-xs">{position.name}</Badge>
                    )}
                    <Badge variant={emp.shift === "morning" ? "default" : "secondary"} className="text-xs">
                      {emp.shift === "morning" ? "صباحي" : "مسائي"}
                    </Badge>
                  </div>

                  <Link href={`/employees/${emp.id}/attendance`}>
                    <Button className="w-full" size="sm" data-testid={`button-view-attendance-${emp.id}`}>
                      <ClipboardList className="h-4 w-4 ml-2" />
                      عرض سجل الحضور
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
