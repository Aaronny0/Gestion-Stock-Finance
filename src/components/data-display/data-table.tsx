"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type VisibilityState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Columns3, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/data-display/empty-state";
import { cn } from "@/lib/utils";
import { useViewState } from "@/frontend/provider";

interface DataTableProps<TData, TValue> {
  name?: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyTitle?: string;
  emptyDescription?: string;
  density?: "default" | "comfortable" | "dense";
  pageSize?: number;
  getRowId?: (row: TData, index: number) => string;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  onRow?: (row: TData) => void;
  mobileRow?: (row: TData) => React.ReactNode;
  enableSelection?: boolean;
  enableColumnVisibility?: boolean;
  canExport?: boolean;
  exportRow?: (row: TData) => Record<string, unknown>;
}

function safeCell(value: unknown) {
  if (typeof value === "string" && /^[=+\-@]/.test(value)) return `'${value}`;
  return value ?? "";
}

function downloadCsv(rows: Record<string, unknown>[], name: string) {
  const columns = Object.keys(rows[0] ?? {});
  if (!columns.length) return;
  const content =
    "\uFEFF" +
    [columns, ...rows.map((row) => columns.map((key) => safeCell(row[key])))]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";"))
      .join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name}.csv`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DataTable<TData, TValue>({
  name = "donnees",
  columns,
  data,
  emptyTitle = "Aucun résultat",
  emptyDescription = "Essayez de modifier vos filtres ou votre recherche.",
  density = "default",
  pageSize = 10,
  getRowId,
  searchPlaceholder = "Rechercher…",
  filters,
  onRow,
  mobileRow,
  enableSelection = false,
  enableColumnVisibility = true,
  canExport = false,
  exportRow,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useViewState<SortingState>(`datatable:${name}:sorting`, []);
  const [globalFilter, setGlobalFilter] = useViewState(`datatable:${name}:search`, "");
  const [rowSelection, setRowSelection] = useViewState<RowSelectionState>(`datatable:${name}:selection`, {});
  const [columnVisibility, setColumnVisibility] = useViewState<VisibilityState>(`datatable:${name}:columns`, {});
  const [pagination, setPagination] = useViewState<PaginationState>(`datatable:${name}:pagination`, { pageIndex: 0, pageSize });
  const [exportError, setExportError] = React.useState("");

  const selectionColumn = React.useMemo<ColumnDef<TData, TValue> | null>(() => {
    if (!enableSelection) return null;
    return {
      id: "select",
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          aria-label={`Tout sélectionner dans ${name}`}
          checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Sélectionner la ligne ${row.id}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
          onClick={(event) => event.stopPropagation()}
        />
      ),
    } as ColumnDef<TData, TValue>;
  }, [enableSelection, name]);

  const tableColumns = React.useMemo(
    () => (selectionColumn ? [selectionColumn, ...columns] : columns),
    [selectionColumn, columns],
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, globalFilter, rowSelection, columnVisibility, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getRowId,
  });

  const cellPadding = density === "dense" ? "p-2" : density === "comfortable" ? "p-4" : "p-3";
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const rowsForExport = selectedRows.length ? selectedRows : table.getFilteredRowModel().rows;
  const exportRows = exportRow ? rowsForExport.map((row) => exportRow(row.original)) : [];
  const pageRows = table.getRowModel().rows;
  const sortableColumns = table.getAllLeafColumns().filter((column) => column.getCanSort() && column.id !== "select");
  const activeSort = sorting[0];

  const handleRowClick = (event: React.MouseEvent, row: Row<TData>) => {
    if (!onRow) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, [role='checkbox'], [role='menuitem']")) return;
    onRow(row.original);
  };

  const exportExcel = async () => {
    setExportError("");
    try {
      const XLSX = await import("xlsx");
      const sheet = XLSX.utils.json_to_sheet(
        exportRows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, safeCell(value)]))),
      );
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, "Données");
      XLSX.writeFile(book, `${name}.xlsx`);
    } catch {
      setExportError("Export Excel indisponible. Réessayez.");
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            aria-label={`Rechercher dans ${name}`}
            placeholder={searchPlaceholder}
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filters}
          {selectedRows.length ? <span className="text-xs text-muted-foreground">{selectedRows.length} sélectionné(s)</span> : null}
          {enableColumnVisibility ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Columns3 /> Colonnes</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                    >
                      {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {canExport && exportRow ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Download /> Exporter</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadCsv(exportRows, name)}><Download /> Fichier CSV</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void exportExcel()}><FileSpreadsheet /> Classeur Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {mobileRow && sortableColumns.length ? (
        <div className="flex items-center gap-2 md:hidden">
          <Select
            value={activeSort?.id ?? "none"}
            onValueChange={(value) => setSorting(value === "none" ? [] : [{ id: value, desc: activeSort?.id === value ? Boolean(activeSort.desc) : false }])}
          >
            <SelectTrigger className="min-h-11 flex-1" aria-label={`Trier ${name}`}>
              <SelectValue placeholder="Trier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ordre par défaut</SelectItem>
              {sortableColumns.map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            disabled={!activeSort}
            aria-label={`Inverser le tri ${name}`}
            onClick={() => activeSort && setSorting([{ id: activeSort.id, desc: !activeSort.desc }])}
          >
            {activeSort?.desc ? "Décroissant" : "Croissant"}
          </Button>
        </div>
      ) : null}

      {exportError ? <p className="text-sm text-destructive" role="alert">{exportError}</p> : null}

      {!table.getFilteredRowModel().rows.length ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          {mobileRow ? (
            <div className="space-y-2 md:hidden">
              {pageRows.map((row) => (
                <div
                  key={row.id}
                  data-row-id={row.id}
                  tabIndex={onRow ? 0 : undefined}
                  aria-label={onRow ? `Ouvrir le détail ${row.id}` : undefined}
                  onClick={(event) => handleRowClick(event, row)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget || !onRow || (event.key !== "Enter" && event.key !== " ")) return;
                    event.preventDefault();
                    onRow(row.original);
                  }}
                  className={cn(onRow && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
                >
                  {mobileRow(row.original)}
                </div>
              ))}
            </div>
          ) : null}

          <div className={cn("overflow-hidden rounded-lg border border-border bg-card", mobileRow && "hidden md:block")}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className={cellPadding} aria-sort={header.column.getIsSorted() === "asc" ? "ascending" : header.column.getIsSorted() === "desc" ? "descending" : "none"}>
                          {header.isPlaceholder ? null : header.column.getCanSort() ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getIsSorted() === "asc" ? "↑" : header.column.getIsSorted() === "desc" ? "↓" : null}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {pageRows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-row-id={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      tabIndex={onRow ? 0 : undefined}
                      aria-label={onRow ? `Ouvrir le détail ${row.id}` : undefined}
                      className={cn(onRow && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring")}
                      onClick={(event) => handleRowClick(event, row)}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget || !onRow || (event.key !== "Enter" && event.key !== " ")) return;
                        event.preventDefault();
                        onRow(row.original);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={cn(cellPadding, density === "dense" && "text-xs")}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {table.getPageCount() > 1 ? (
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Page {table.getState().pagination.pageIndex + 1} sur {table.getPageCount()}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Page précédente"><ChevronLeft className="size-4" /></Button>
            <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Page suivante"><ChevronRight className="size-4" /></Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { DataTable, type DataTableProps };
