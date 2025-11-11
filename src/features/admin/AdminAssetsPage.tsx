import { motion } from "framer-motion";
import { useState } from "react";
import {
  Loader2,
  RefreshCcw,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  PageLayout,
  PageHeader,
  PageSubHeader,
  PageContent,
  PageActions,
} from "@/components/PageLayout";
import { useGetAdminAssetsQuery } from "@/api/adminService";

const AdminAssetsPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useGetAdminAssetsQuery({ page });
  const assets = data?.results || [];
  const totalPages = Math.ceil((data?.count || 1) / 50); // assuming DRF pagination default 50 per page

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <div className="space-y-4 text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      header={<PageHeader>Assets Management</PageHeader>}
      subheader={<PageSubHeader>View and monitor all Alpaca assets.</PageSubHeader>}
      actions={
        <PageActions>
          <Button onClick={() => refetch()} size="sm" className="w-full sm:w-auto">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
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
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Exchange</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tradable</TableHead>
                  <TableHead>Marginable</TableHead>
                  <TableHead>Watchlists</TableHead>
                  <TableHead>Trades</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.length > 0 ? (
                  assets.map((asset: any) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.symbol}</TableCell>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{asset.asset_class}</Badge>
                      </TableCell>
                      <TableCell>{asset.exchange}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            asset.status === "active"
                              ? "success"
                              : "destructive"
                          }
                        >
                          {asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={asset.tradable ? "success" : "secondary"}>
                          {asset.tradable ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={asset.marginable ? "success" : "secondary"}>
                          {asset.marginable ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>{asset.watchlists_count}</TableCell>
                      <TableCell>{asset.trades_count}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No assets found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={handlePrev}
              disabled={page === 1}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Prev
            </Button>
            <div className="text-muted-foreground text-sm">
              Page {page} of {totalPages}
            </div>
            <Button
              onClick={handleNext}
              disabled={page === totalPages}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </PageContent>
    </PageLayout>
  );
};

export default AdminAssetsPage;
