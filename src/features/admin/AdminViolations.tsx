import React from 'react';
import { useGetAdminViolationsQuery } from '@/api/baseApi';
import LoadingScreen from '@/components/LoadingScreen';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

const AdminViolations: React.FC = () => {
  const { data, isLoading, error, refetch } = useGetAdminViolationsQuery({});

  if (isLoading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load violations. Please try again.</p>
            <Button onClick={() => refetch()} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const violations = (data as any)?.results || (data as any) || [];

  const getViolationTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      DAILY_LOSS: 'destructive',
      TOTAL_LOSS: 'destructive',
      POSITION_SIZE: 'default',
      MIN_DAYS: 'secondary',
    };

    return (
      <Badge variant={colors[type] as any || 'secondary'}>
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-[1600px]">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-8 h-8" />
              Rule Violations
            </h1>
            <p className="text-muted-foreground">Trading rule violations log</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            Refresh
          </Button>
        </div>

        {/* Violations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Violations ({violations.length})</CardTitle>
            <CardDescription>Complete list of rule violations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Violation Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No violations found
                    </TableCell>
                  </TableRow>
                ) : (
                  violations.map((violation: any) => (
                    <TableRow key={violation.id}>
                      <TableCell className="font-mono">
                        {violation.account_number}
                      </TableCell>
                      <TableCell>{violation.user_email}</TableCell>
                      <TableCell>
                        {getViolationTypeBadge(violation.violation_type)}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {violation.description}
                      </TableCell>
                      <TableCell>
                        ${Number(violation.threshold_value).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-red-600 font-semibold">
                        ${Number(violation.actual_value).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(violation.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <a
                          href={`/admin/prop_firm/ruleviolation/${violation.id}/change/`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminViolations;