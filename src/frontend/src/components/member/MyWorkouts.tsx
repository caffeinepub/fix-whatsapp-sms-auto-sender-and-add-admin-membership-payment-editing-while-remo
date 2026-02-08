import { useGetMemberProfile } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Dumbbell } from 'lucide-react';

export default function MyWorkouts() {
  const { data: memberProfile, isLoading } = useGetMemberProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!memberProfile?.workoutPlan) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Dumbbell className="mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No Workout Plan Assigned</h3>
          <p className="text-sm text-muted-foreground">
            Your trainer hasn't assigned a workout plan yet. Check back soon!
          </p>
        </CardContent>
      </Card>
    );
  }

  const plan = memberProfile.workoutPlan;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          <CardDescription>{plan.description}</CardDescription>
          <div className="mt-2">
            <span className="text-sm text-muted-foreground">
              Duration: <strong>{Number(plan.durationWeeks)} weeks</strong>
            </span>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Exercises</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {plan.exercises.map((exercise, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{exercise.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{Number(exercise.sets)}</p>
                    <p className="text-xs text-muted-foreground">Sets</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{Number(exercise.reps)}</p>
                    <p className="text-xs text-muted-foreground">Reps</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {Number(exercise.weightKg) > 0 ? `${Number(exercise.weightKg)}kg` : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">Weight</p>
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
