import { useGetMemberProfile } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Apple } from 'lucide-react';

export default function MyDiet() {
  const { data: memberProfile, isLoading } = useGetMemberProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!memberProfile?.dietPlan) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Apple className="mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No Diet Plan Assigned</h3>
          <p className="text-sm text-muted-foreground">
            Your trainer hasn't assigned a diet plan yet. Check back soon!
          </p>
        </CardContent>
      </Card>
    );
  }

  const plan = memberProfile.dietPlan;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          <CardDescription>{plan.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{Number(plan.calories)}</p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{Number(plan.proteinG)}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{Number(plan.carbsG)}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{Number(plan.fatG)}g</p>
              <p className="text-xs text-muted-foreground">Fat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Meals</h3>
        <div className="space-y-4">
          {plan.meals.map((meal, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{meal.name}</CardTitle>
                <CardDescription>{meal.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Calories</p>
                    <p className="font-semibold">{Number(meal.calories)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Protein</p>
                    <p className="font-semibold">{Number(meal.proteinG)}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Carbs</p>
                    <p className="font-semibold">{Number(meal.carbsG)}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fat</p>
                    <p className="font-semibold">{Number(meal.fatG)}g</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
