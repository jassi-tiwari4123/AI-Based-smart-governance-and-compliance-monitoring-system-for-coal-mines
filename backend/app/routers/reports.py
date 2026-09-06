from fastapi import APIRouter, Depends, Response
from app.services.reports.report_service import ReportService
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Statutory Reports & Data Exports"])

@router.get("/compliance")
async def get_compliance_report(current_user: dict = Depends(get_current_user)):
    report = await ReportService.generate_compliance_report()
    return report

@router.get("/export/{report_type}")
async def export_csv(report_type: str, current_user: dict = Depends(get_current_user)):
    csv_data = await ReportService.export_csv_report(report_type)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=mineguard_{report_type}_report.csv"}
    )
