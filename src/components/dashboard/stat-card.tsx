import {cn} from '@/lib/utils';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: JSX.Element;
  trend?: 'up' | 'down' | 'warning' | 'neutral';
  className?: string;
}

export const StatCard = ({
  title,
  value,
  description,
  icon,
  trend = 'neutral',
  className,
}: StatCardProps) => {
  return (
    <Card className={cn("overflow-hidden transition-all duration-200 hover:shadow-md", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-sm font-medium text-muted-foreground",
              )}>
            {title}
          </CardTitle>
          <div className="rounded-full p-1">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={cn(
          "mt-1 text-xs",
          trend === 'up' ? "text-success" : trend === 'down' ? "text-destructive" : trend === 'warning' ? "text-warning" : "text-muted-foreground"
        )}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
};