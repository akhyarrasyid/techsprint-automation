"""
Data Quality Service — Missing values, duplicates, outliers, schema checks, quality scoring.
"""
from typing import Dict, Any, List
import numpy as np
from services.pipeline_store import PipelineStore


def assess_data_quality(scenario: str = "Base") -> Dict[str, Any]:
    """Run comprehensive data quality assessment."""
    df = PipelineStore.get_df()
    checks: List[Dict[str, Any]] = []
    total_score = 100.0

    # 1. Missing values
    missing = int(df.isnull().sum().sum())
    missing_pct = round((missing / (df.shape[0] * df.shape[1])) * 100, 2)
    checks.append({
        "check": "Missing Values", "status": "pass" if missing == 0 else "warning",
        "count": missing, "detail": f"{missing} missing values ({missing_pct}%)",
        "severity": "low" if missing_pct < 1 else ("medium" if missing_pct < 5 else "high"),
    })
    if missing_pct > 0:
        total_score -= min(20, missing_pct * 4)

    # 2. Duplicates
    dupes = int(df.duplicated().sum())
    dupe_pct = round((dupes / len(df)) * 100, 2)
    checks.append({
        "check": "Duplicate Rows", "status": "pass" if dupes == 0 else "warning",
        "count": dupes, "detail": f"{dupes} duplicate rows ({dupe_pct}%)",
        "severity": "low" if dupe_pct < 1 else "medium",
    })
    if dupe_pct > 0:
        total_score -= min(15, dupe_pct * 3)

    # 3. Outliers (IQR on sales_qty)
    outlier_count = 0
    if "sales_qty" in df.columns:
        q1 = df["sales_qty"].quantile(0.25)
        q3 = df["sales_qty"].quantile(0.75)
        iqr = q3 - q1
        outliers = df[(df["sales_qty"] < q1 - 1.5 * iqr) | (df["sales_qty"] > q3 + 1.5 * iqr)]
        outlier_count = len(outliers)
    checks.append({
        "check": "Outliers (Sales)", "status": "pass" if outlier_count == 0 else "info",
        "count": outlier_count, "detail": f"{outlier_count} outlier data points in sales_qty",
        "severity": "low",
    })
    if outlier_count > 5:
        total_score -= min(10, outlier_count)

    # 4. Schema check
    required_cols = ["date", "product_id", "sales_qty", "current_stock", "selling_price", "unit_cost", "lead_time_days"]
    missing_cols = [c for c in required_cols if c not in df.columns]
    checks.append({
        "check": "Schema Validation", "status": "pass" if not missing_cols else "fail",
        "count": len(missing_cols), "detail": f"Missing columns: {missing_cols}" if missing_cols else "All required columns present",
        "severity": "high" if missing_cols else "low",
    })
    if missing_cols:
        total_score -= 30

    # 5. Negative values
    neg_count = 0
    numeric_cols = ["sales_qty", "current_stock", "selling_price", "unit_cost"]
    for col in numeric_cols:
        if col in df.columns:
            neg_count += int((df[col] < 0).sum())
    checks.append({
        "check": "Negative Values", "status": "pass" if neg_count == 0 else "warning",
        "count": neg_count, "detail": f"{neg_count} negative values in numeric columns",
        "severity": "medium" if neg_count > 0 else "low",
    })
    if neg_count > 0:
        total_score -= min(10, neg_count * 2)

    # 6. Date range completeness
    if "date" in df.columns:
        dates = sorted(df["date"].unique())
        date_range = f"{dates[0]} to {dates[-1]}" if dates else "N/A"
        checks.append({
            "check": "Date Range", "status": "pass", "count": len(dates),
            "detail": f"Date range: {date_range} ({len(dates)} unique dates)",
            "severity": "low",
        })

    # Summary
    total_score = max(0, round(total_score, 1))
    grade = "A" if total_score >= 90 else ("B" if total_score >= 75 else ("C" if total_score >= 60 else "D"))

    return {
        "quality_score": total_score, "grade": grade,
        "checks": checks, "row_count": len(df), "column_count": len(df.columns),
        "product_count": int(df["product_id"].nunique()) if "product_id" in df.columns else 0,
        "summary": {
            "pass": sum(1 for c in checks if c["status"] == "pass"),
            "warning": sum(1 for c in checks if c["status"] == "warning"),
            "fail": sum(1 for c in checks if c["status"] == "fail"),
            "info": sum(1 for c in checks if c["status"] == "info"),
        },
    }
