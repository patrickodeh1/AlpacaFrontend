import { motion } from "framer-motion";
import { Loader2, ListChecks, User, Calendar, RefreshCcw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageLayout, PageHeader, PageSubHeader, PageContent, PageActions } from "@/components/PageLayout";
import { useGetAdminWatchlistsQuery } from "@/api/propFirmService";

const AdminWatchlistsPage = () => {
  const { data, isLoading, refetch } = useGetAdminWatchlistsQuery({});
  const watchlists = data?.results || data || [];

  return (
    <PageLayout
      header={<PageHeader>Admin — Watchlists</PageHeader>}
      subheader={<PageSubHeader>Monitor and manage user watchlists.</PageSubHeader>}
      actions={
        <PageActions>
          <Button onClick={() => refetch()} disabled={isLoading} className="w-full sm:w-auto" size="sm">
            <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </PageActions>
      }
    >
      <PageContent>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Assets Count</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {watchlists?.map((w: any) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-muted-foreground" />
                        {w.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {w.user_email || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={w.is_active ? "success" : "secondary"}>
                          {w.is_active ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={w.is_default ? "default" : "outline"}>
                          {w.is_default ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{w.assets_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(w.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </motion.div>
      </PageContent>
    </PageLayout>
  );
};

export default AdminWatchlistsPage;
