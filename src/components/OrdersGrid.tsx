"use client";

import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
} from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

type Row = {
  id: string;
  paypalOrderId: string;
  status: string;
  mode: string;
  intent: string;
  amount: string;
  riskLevel: string;
  riskScore: number;
  createdAt: string;
  captureId?: string;
};

export function OrdersGrid() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      const mapped: Row[] = (data.orders || []).map(
        (o: {
          id: string;
          paypalOrderId: string;
          status: string;
          mode: string;
          intent: string;
          amount: { value: string };
          risk?: { level: string; score: number };
          createdAt: string;
          captureId?: string;
        }) => ({
          id: o.id,
          paypalOrderId: o.paypalOrderId,
          status: o.status,
          mode: o.mode,
          intent: o.intent,
          amount: `$${o.amount.value}`,
          riskLevel: o.risk?.level || "—",
          riskScore: o.risk?.score ?? 0,
          createdAt: new Date(o.createdAt).toLocaleString("en-US", {
            timeZone: "America/Los_Angeles",
          }),
          captureId: o.captureId,
        }),
      );
      setRows(mapped);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, []);

  const columnDefs = useMemo<ColDef<Row>[]>(
    () => [
      { field: "createdAt", headerName: "Created (PT)", flex: 1.2, filter: true },
      { field: "intent", headerName: "Intent", flex: 1.6, filter: true },
      { field: "amount", headerName: "Amount", width: 110 },
      { field: "status", headerName: "Status", width: 140, filter: true },
      { field: "mode", headerName: "Mode", width: 110, filter: true },
      { field: "riskLevel", headerName: "Risk", width: 110, filter: true },
      { field: "riskScore", headerName: "Score", width: 100 },
      { field: "paypalOrderId", headerName: "PayPal Order", flex: 1.3 },
      { field: "captureId", headerName: "Capture", flex: 1 },
      { field: "id", headerName: "Local ID", width: 120 },
    ],
    [],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Order ops dashboard</h2>
          <p className="text-sm text-slate-400">
            AG Grid community table of agent-created PayPal orders with risk scores.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <div className="h-[480px] w-full overflow-hidden rounded-2xl border border-white/10">
        <AgGridReact
          theme={themeQuartz}
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={{ sortable: true, resizable: true }}
          animateRows
        />
      </div>
    </div>
  );
}
