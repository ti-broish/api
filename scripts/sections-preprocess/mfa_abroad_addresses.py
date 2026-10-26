# /// script
# requires-python = ">=3.10"
# dependencies = ["openpyxl"]
# ///
"""Turn the МВнР table of abroad sections (https://mfa.bg/bg/pvr2026/adresi)
into a CSV for `npm run sections:update-abroad-addresses` or
PATCH /sections/abroad/addresses.

Usage: uv run scripts/sections-preprocess/mfa_abroad_addresses.py <table.xlsx> [out.csv]

Columns: section_id, country, place, address. The address is the Bulgarian one,
else the local-language one. Writes to stdout without out.csv.
"""
import csv
import re
import sys

import openpyxl


def clean(value) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def read_sections(path: str) -> dict[str, dict[str, str]]:
    sheet = openpyxl.load_workbook(path, read_only=True, data_only=True).worksheets[0]
    sections: dict[str, dict[str, str]] = {}
    country = ""
    for row in sheet.iter_rows(values_only=True):
        cells = [clean(cell) for cell in row[:7]]
        while len(cells) < 7:
            cells.append("")
        _, country_cell, code, place, address, address_local, _ = cells
        # The country is only on the first row of its group; the next row holds „N секции“.
        if country_cell and not re.search(r"\d+\s+секци", country_cell):
            country = country_cell
        code = re.sub(r"\D", "", code)
        if not re.fullmatch(r"32\d{7}", code):
            continue
        entry = {"country": country, "place": place, "address": address or address_local}
        if code in sections and sections[code] != entry:
            raise SystemExit(f"conflicting rows for {code}")
        sections[code] = entry
    return sections


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    sections = read_sections(sys.argv[1])
    out = open(sys.argv[2], "w", newline="", encoding="utf-8") if len(sys.argv) > 2 else sys.stdout
    writer = csv.writer(out, lineterminator="\n")
    writer.writerow(["section_id", "country", "place", "address"])
    for code, entry in sorted(sections.items()):
        writer.writerow([code, entry["country"], entry["place"], entry["address"]])
    if out is not sys.stdout:
        out.close()
    missing = [code for code, entry in sections.items() if not entry["address"]]
    print(
        f"{len(sections)} sections, {len(sections) - len(missing)} with an address"
        + (f"; without: {', '.join(sorted(missing))}" if missing else ""),
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
