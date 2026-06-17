"""
Pipeline Runner — executes the Kopikita business pipeline from CLI.

Called by upload_router.py via subprocess:
  python notebooks/pipeline_runner.py

Exit code 0 = success, non-zero = failure.
"""

import os
import sys
import time

# Ensure backend root is on path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)


def main():
    from data_loader.generate_results import main as run_pipeline

    t0 = time.time()
    try:
        run_pipeline()
    except Exception as exc:
        print(f"[PIPELINE ERROR] {exc}", file=sys.stderr)
        sys.exit(1)

    elapsed = time.time() - t0
    print(f"[PIPELINE OK] Completed in {elapsed:.2f}s", flush=True)


if __name__ == "__main__":
    main()
