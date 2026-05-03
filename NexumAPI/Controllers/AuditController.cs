using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexumAPI.Data;
using NexumAPI.Helpers;

namespace NexumAPI.Controllers
{
    [ApiController]
    [Route("api/audit")]
    [Authorize]
    public class AuditController : ControllerBase
    {
        private readonly NexumDbContext _context;
        public AuditController(NexumDbContext context) => _context = context;

        // TEMP DEBUG — remove after fixing
        [HttpGet("whoami")]
        [AllowAnonymous]
        public IActionResult WhoAmI()
        {
            var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
            var isAuth = User.Identity?.IsAuthenticated ?? false;
            return Ok(new { isAuthenticated = isAuth, claims });
        }

        // GET /api/audit — Auditor and above
        [HttpGet]
        [Authorize(Policy = "Auditor")]
        public async Task<IActionResult> GetLogs(
            [FromQuery] int     page      = 1,
            [FromQuery] int     pageSize  = 10,
            [FromQuery] string? action    = null,
            [FromQuery] string? status    = null,
            [FromQuery] string? search    = null,
            [FromQuery] string? module    = null,
            [FromQuery] string? dateRange = null)
        {
            page     = PaginationHelper.ValidatePage(page);
            pageSize = PaginationHelper.ValidatePageSize(pageSize);

            var query = _context.AuditLogs
                .Include(a => a.User)
                .AsQueryable();

            query = query.Where(a =>
                !a.Action.StartsWith("GET ")    &&
                !a.Action.StartsWith("POST ")   &&
                !a.Action.StartsWith("PUT ")    &&
                !a.Action.StartsWith("DELETE ") &&
                !a.Action.StartsWith("PATCH "));

            if (!string.IsNullOrEmpty(action))
                query = query.Where(a => a.Action == action);
            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status == status);
            if (!string.IsNullOrEmpty(module) && module != "all")
                query = query.Where(a => a.Module == module);
            if (!string.IsNullOrEmpty(search))
                query = query.Where(a =>
                    (a.Action  != null && a.Action.Contains(search))  ||
                    (a.Details != null && a.Details.Contains(search)) ||
                    (a.User    != null && a.User.Name.Contains(search)));

            if (!string.IsNullOrEmpty(dateRange))
            {
                var now  = DateTime.UtcNow;
                var from = dateRange switch {
                    "today"   => now.Date,
                    "last-7"  => now.AddDays(-7),
                    "last-30" => now.AddDays(-30),
                    "last-90" => now.AddDays(-90),
                    _         => (DateTime?)null
                };
                if (from.HasValue)
                    query = query.Where(a => a.CreatedAt >= from.Value);
            }

            var totalItems = await query.CountAsync();

            var logs = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip(PaginationHelper.CalculateSkip(page, pageSize))
                .Take(pageSize)
                .Select(a => new {
                    a.Id,
                    a.Action,
                    a.Module,
                    a.Target,
                    a.Details,
                    a.Status,
                    a.IpAddress,
                    a.CreatedAt,
                    UserName  = a.User != null ? a.User.Name       : "System",
                    UserEmpId = a.User != null ? a.User.EmployeeId : "—",
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<dynamic>(
                logs.Cast<dynamic>().ToList(),
                page,
                pageSize,
                totalItems
            ));
        }

        // GET /api/audit/summary — Auditor and above
        [HttpGet("summary")]
        [Authorize(Policy = "Auditor")]
        public async Task<IActionResult> GetSummary()
        {
            var total   = await _context.AuditLogs.CountAsync();
            var success = await _context.AuditLogs.CountAsync(a => a.Status == "Success");
            var failed  = await _context.AuditLogs.CountAsync(a => a.Status == "Failed");
            var today   = await _context.AuditLogs.CountAsync(a => a.CreatedAt >= DateTime.UtcNow.Date);

            return Ok(new { total, success, failed, today });
        }

        // GET /api/audit/transactions — Auditor and above
        [HttpGet("transactions")]
        [Authorize(Policy = "Auditor")]
        public async Task<IActionResult> GetTransactions(
            [FromQuery] int     page      = 1,
            [FromQuery] int     pageSize  = 10,
            [FromQuery] string? search    = null,
            [FromQuery] string? module    = null,
            [FromQuery] string? dateRange = null)
        {
            page     = PaginationHelper.ValidatePage(page);
            pageSize = PaginationHelper.ValidatePageSize(pageSize);

            var query = _context.TransactionTrails
                .Include(t => t.Performer)
                .Include(t => t.TargetUser)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
                query = query.Where(t =>
                    t.TxnId.Contains(search)  ||
                    t.Action.Contains(search) ||
                    (t.Details    != null && t.Details.Contains(search))         ||
                    (t.Performer  != null && t.Performer.Name.Contains(search))  ||
                    (t.TargetUser != null && t.TargetUser.Name.Contains(search)));

            if (!string.IsNullOrEmpty(module) && module != "all")
                query = query.Where(t => t.Module == module);

            if (!string.IsNullOrEmpty(dateRange))
            {
                var now  = DateTime.UtcNow;
                var from = dateRange switch {
                    "today"   => now.Date,
                    "last-7"  => now.AddDays(-7),
                    "last-30" => now.AddDays(-30),
                    "last-90" => now.AddDays(-90),
                    _         => (DateTime?)null
                };
                if (from.HasValue)
                    query = query.Where(t => t.CreatedAt >= from.Value);
            }

            var totalItems = await query.CountAsync();

            var trails = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip(PaginationHelper.CalculateSkip(page, pageSize))
                .Take(pageSize)
                .Select(t => new {
                    t.Id,
                    t.TxnId,
                    t.Action,
                    t.Module,
                    t.Details,
                    t.Status,
                    t.IpAddress,
                    t.CreatedAt,
                    PerformedBy    = t.Performer  != null ? t.Performer.Name       : "System",
                    PerformerEmpId = t.Performer  != null ? t.Performer.EmployeeId : "—",
                    TargetUser     = t.TargetUser != null ? t.TargetUser.Name      : "—",
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<dynamic>(
                trails.Cast<dynamic>().ToList(),
                page,
                pageSize,
                totalItems
            ));
        }

        // GET /api/audit/export — Auditor and above
        [HttpGet("export")]
        [Authorize(Policy = "Auditor")]
        public async Task<IActionResult> Export(
            [FromQuery] string  format    = "csv",
            [FromQuery] string? dateRange = null,
            [FromQuery] string? type      = "activity")
        {
            var now  = DateTime.UtcNow;
            var from = dateRange switch {
                "today"   => now.Date,
                "last-7"  => now.AddDays(-7),
                "last-30" => now.AddDays(-30),
                "last-90" => now.AddDays(-90),
                _         => now.AddDays(-30)
            };

            if (type == "transactions")
            {
                var trails = await _context.TransactionTrails
                    .Include(t => t.Performer)
                    .Include(t => t.TargetUser)
                    .Where(t => t.CreatedAt >= from)
                    .OrderByDescending(t => t.CreatedAt)
                    .ToListAsync();

                if (format == "csv")
                {
                    var csv = "TxnId,Action,Module,PerformedBy,TargetUser,Details,Status,IpAddress,Date\n" +
                        string.Join("\n", trails.Select(t =>
                            $"\"{t.TxnId}\",\"{t.Action}\",\"{t.Module}\"," +
                            $"\"{t.Performer?.Name ?? "System"}\",\"{t.TargetUser?.Name ?? "—"}\"," +
                            $"\"{t.Details?.Replace("\"", "'")}\",\"{t.Status}\"," +
                            $"\"{t.IpAddress}\",\"{t.CreatedAt:yyyy-MM-dd HH:mm:ss}\""));
                    return File(System.Text.Encoding.UTF8.GetBytes(csv),
                        "text/csv", $"transaction-trail-{from:yyyyMMdd}.csv");
                }
            }
            else
            {
                var logs = await _context.AuditLogs
                    .Include(a => a.User)
                    .Where(a => a.CreatedAt >= from &&
                                !a.Action.StartsWith("GET ")    &&
                                !a.Action.StartsWith("POST ")   &&
                                !a.Action.StartsWith("PUT ")    &&
                                !a.Action.StartsWith("DELETE "))
                    .OrderByDescending(a => a.CreatedAt)
                    .ToListAsync();

                if (format == "csv")
                {
                    var csv = "User,EmployeeId,Action,Module,Target,Details,Status,IpAddress,Date\n" +
                        string.Join("\n", logs.Select(a =>
                            $"\"{a.User?.Name ?? "System"}\",\"{a.User?.EmployeeId ?? "—"}\"," +
                            $"\"{a.Action}\",\"{a.Module}\",\"{a.Target}\"," +
                            $"\"{a.Details?.Replace("\"", "'")}\",\"{a.Status}\"," +
                            $"\"{a.IpAddress}\",\"{a.CreatedAt:yyyy-MM-dd HH:mm:ss}\""));
                    return File(System.Text.Encoding.UTF8.GetBytes(csv),
                        "text/csv", $"activity-logs-{from:yyyyMMdd}.csv");
                }
            }

            return BadRequest(new { success = false, message = "Unsupported format" });
        }

        // GET /api/audit/export/pdf — Auditor and above
        [HttpGet("export/pdf")]
        [Authorize(Policy = "Auditor")]
        public async Task<IActionResult> ExportPdf(
            [FromQuery] string dateRange = "last-30",
            [FromQuery] string type      = "activity",
            [FromQuery] int    tzOffset  = 0)
        {
            var now  = DateTime.UtcNow.AddMinutes(tzOffset);
            var from = dateRange switch {
                "today"   => now.Date,
                "last-7"  => now.AddDays(-7),
                "last-30" => now.AddDays(-30),
                "last-90" => now.AddDays(-90),
                _         => now.AddDays(-30)
            };

            var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "public", "images", "logolgn.png");

            using var ms     = new MemoryStream();
            using var writer = new iText.Kernel.Pdf.PdfWriter(ms);
            using var pdf    = new iText.Kernel.Pdf.PdfDocument(writer);
            var document     = new iText.Layout.Document(pdf, iText.Kernel.Geom.PageSize.A4);
            document.SetMargins(36, 36, 36, 36);

            var teal      = new iText.Kernel.Colors.DeviceRgb(45,  185, 163);
            var darkText  = new iText.Kernel.Colors.DeviceRgb(15,  23,  42);
            var grayText  = new iText.Kernel.Colors.DeviceRgb(100, 116, 139);
            var lightGray = new iText.Kernel.Colors.DeviceRgb(248, 250, 252);
            var borderClr = new iText.Kernel.Colors.DeviceRgb(226, 232, 240);
            var white     = iText.Kernel.Colors.ColorConstants.WHITE;
            var red       = new iText.Kernel.Colors.DeviceRgb(220, 38,  38);
            var green     = new iText.Kernel.Colors.DeviceRgb(5,   150, 105);

            var boldFont   = iText.Kernel.Font.PdfFontFactory.CreateFont(iText.IO.Font.Constants.StandardFonts.HELVETICA_BOLD);
            var normalFont = iText.Kernel.Font.PdfFontFactory.CreateFont(iText.IO.Font.Constants.StandardFonts.HELVETICA);

            var headerTable = new iText.Layout.Element.Table(new float[]{ 120, 1 })
                .SetWidth(iText.Layout.Properties.UnitValue.CreatePercentValue(100))
                .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
                .SetMarginBottom(20);

            var logoCell = new iText.Layout.Element.Cell()
                .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
                .SetVerticalAlignment(iText.Layout.Properties.VerticalAlignment.MIDDLE);

            if (System.IO.File.Exists(logoPath))
            {
                var imgData = iText.IO.Image.ImageDataFactory.Create(logoPath);
                var img     = new iText.Layout.Element.Image(imgData).SetWidth(110).SetAutoScale(false);
                logoCell.Add(img);
            }
            else
            {
                logoCell.Add(new iText.Layout.Element.Paragraph("NEXUM")
                    .SetFont(boldFont).SetFontSize(22).SetFontColor(teal));
            }
            headerTable.AddCell(logoCell);

            var infoCell = new iText.Layout.Element.Cell()
                .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
                .SetTextAlignment(iText.Layout.Properties.TextAlignment.RIGHT)
                .SetVerticalAlignment(iText.Layout.Properties.VerticalAlignment.MIDDLE);
            infoCell.Add(new iText.Layout.Element.Paragraph("Nexum Banking ERP")
                .SetFont(boldFont).SetFontSize(11).SetFontColor(darkText));
            infoCell.Add(new iText.Layout.Element.Paragraph("Security & Compliance Report")
                .SetFont(normalFont).SetFontSize(9).SetFontColor(grayText));
            infoCell.Add(new iText.Layout.Element.Paragraph($"Generated: {now:MMMM dd, yyyy  hh:mm tt}")
                .SetFont(normalFont).SetFontSize(9).SetFontColor(grayText));
            headerTable.AddCell(infoCell);
            document.Add(headerTable);

            document.Add(new iText.Layout.Element.LineSeparator(
                new iText.Kernel.Pdf.Canvas.Draw.SolidLine(2f))
                .SetStrokeColor(teal).SetMarginBottom(16));

            var titleLabel = type == "transactions" ? "Transaction Trail" : "Activity Log";
            document.Add(new iText.Layout.Element.Paragraph(titleLabel)
                .SetFont(boldFont).SetFontSize(20).SetFontColor(darkText).SetMarginBottom(4));
            document.Add(new iText.Layout.Element.Paragraph(
                $"Period: {from:MMMM dd, yyyy} — {now:MMMM dd, yyyy}")
                .SetFont(normalFont).SetFontSize(10).SetFontColor(grayText).SetMarginBottom(16));

            int totalCount, successCount, failedCount;

            if (type == "transactions")
            {
                var trails = await _context.TransactionTrails
                    .Where(t => t.CreatedAt >= from).ToListAsync();
                totalCount   = trails.Count;
                successCount = trails.Count(t => t.Status == "Success");
                failedCount  = trails.Count(t => t.Status == "Failed");
            }
            else
            {
                var allLogs = await _context.AuditLogs
                    .Where(a => a.CreatedAt >= from &&
                                !a.Action.StartsWith("GET ")  &&
                                !a.Action.StartsWith("POST ") &&
                                !a.Action.StartsWith("PUT ")  &&
                                !a.Action.StartsWith("DELETE "))
                    .ToListAsync();
                totalCount   = allLogs.Count;
                successCount = allLogs.Count(a => a.Status == "Success");
                failedCount  = allLogs.Count(a => a.Status == "Failed");
            }

            var statsTable = new iText.Layout.Element.Table(new float[]{ 1, 1, 1 })
                .SetWidth(iText.Layout.Properties.UnitValue.CreatePercentValue(100))
                .SetMarginBottom(20);

            void AddStatCell(iText.Layout.Element.Table t, string label, string value, iText.Kernel.Colors.Color color)
            {
                var cell = new iText.Layout.Element.Cell()
                    .SetBackgroundColor(lightGray)
                    .SetBorder(new iText.Layout.Borders.SolidBorder(borderClr, 1))
                    .SetPadding(12)
                    .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER);
                cell.Add(new iText.Layout.Element.Paragraph(value)
                    .SetFont(boldFont).SetFontSize(22).SetFontColor(color).SetMarginBottom(2));
                cell.Add(new iText.Layout.Element.Paragraph(label)
                    .SetFont(normalFont).SetFontSize(9).SetFontColor(grayText));
                t.AddCell(cell);
            }

            AddStatCell(statsTable, "Total Records", totalCount.ToString(),   teal);
            AddStatCell(statsTable, "Successful",    successCount.ToString(), green);
            AddStatCell(statsTable, "Failed",        failedCount.ToString(),  red);
            document.Add(statsTable);

            if (type == "transactions")
            {
                var data = await _context.TransactionTrails
                    .Include(t => t.Performer)
                    .Include(t => t.TargetUser)
                    .Where(t => t.CreatedAt >= from)
                    .OrderByDescending(t => t.CreatedAt)
                    .Take(500)
                    .ToListAsync();

                var table = new iText.Layout.Element.Table(new float[]{ 90, 65, 80, 70, 90, 50 })
                    .SetWidth(iText.Layout.Properties.UnitValue.CreatePercentValue(100))
                    .SetMarginBottom(20);

                foreach (var h in new[]{ "TXN ID", "Date & Time", "Performed By", "Target", "Action", "Status" })
                {
                    table.AddHeaderCell(new iText.Layout.Element.Cell()
                        .SetBackgroundColor(teal)
                        .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
                        .SetPadding(8)
                        .Add(new iText.Layout.Element.Paragraph(h)
                            .SetFont(boldFont).SetFontSize(8).SetFontColor(white)));
                }

                bool alt = false;
                foreach (var r in data)
                {
                    var bg          = alt ? lightGray : white;
                    var border      = new iText.Layout.Borders.SolidBorder(borderClr, 0.5f);
                    var statusColor = r.Status == "Success" ? green : red;

                    table.AddCell(new iText.Layout.Element.Cell().SetBackgroundColor(bg).SetBorder(border).SetPadding(6)
                        .Add(new iText.Layout.Element.Paragraph(r.TxnId)
                            .SetFont(boldFont).SetFontSize(7).SetFontColor(teal)));
                    table.AddCell(new iText.Layout.Element.Cell().SetBackgroundColor(bg).SetBorder(border).SetPadding(6)
                        .Add(new iText.Layout.Element.Paragraph(r.CreatedAt.ToString("MM/dd HH:mm"))
                            .SetFont(normalFont).SetFontSize(7).SetFontColor(grayText)));
                    table.AddCell(new iText.Layout.Element.Cell().SetBackgroundColor(bg).SetBorder(border).SetPadding(6)
                        .Add(new iText.Layout.Element.Paragraph(r.Performer?.Name ?? "System")
                            .SetFont(normalFont).SetFontSize(7).SetFontColor(darkText)));
                    table.AddCell(new iText.Layout.Element.Cell().SetBackgroundColor(bg).SetBorder(border).SetPadding(6)
                        .Add(new iText.Layout.Element.Paragraph(r.TargetUser?.Name ?? "—")
                            .SetFont(normalFont).SetFontSize(7).SetFontColor(darkText)));
                    table.AddCell(new iText.Layout.Element.Cell().SetBackgroundColor(bg).SetBorder(border).SetPadding(6)
                        .Add(new iText.Layout.Element.Paragraph(r.Action)
                            .SetFont(normalFont).SetFontSize(7).SetFontColor(darkText)));
                    table.AddCell(new iText.Layout.Element.Cell().SetBackgroundColor(bg).SetBorder(border).SetPadding(6)
                        .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER)
                        .Add(new iText.Layout.Element.Paragraph(r.Status)
                            .SetFont(boldFont).SetFontSize(7).SetFontColor(statusColor)));
                    alt = !alt;
                }
                document.Add(table);
            }
            else
            {
                var data = await _context.AuditLogs
                    .Include(a => a.User)
                    .Where(a => a.CreatedAt >= from &&
                                !a.Action.StartsWith("GET ")    &&
                                !a.Action.StartsWith("POST ")   &&
                                !a.Action.StartsWith("PUT ")    &&
                                !a.Action.StartsWith("DELETE "))
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(500)
                    .ToListAsync();

                var table = new iText.Layout.Element.Table(new float[]{ 80, 65, 90, 80, 90, 50 })
                    .SetWidth(iText.Layout.Properties.UnitValue.CreatePercentValue(100))
                    .SetMarginBottom(20);

                foreach (var h in new[]{ "User", "Emp ID", "Action", "Module", "Date & Time", "Status" })
                {
                    table.AddHeaderCell(new iText.Layout.Element.Cell()
                        .SetBackgroundColor(teal)
                        .SetBorder(iText.Layout.Borders.Border.NO_BORDER)
                        .SetPadding(8)
                        .Add(new iText.Layout.Element.Paragraph(h)
                            .SetFont(boldFont).SetFontSize(8).SetFontColor(white)));
                }

                bool alt = false;
                foreach (var a in data)
                {
                    var bg          = alt ? lightGray : white;
                    var border      = new iText.Layout.Borders.SolidBorder(borderClr, 0.5f);
                    var statusColor = a.Status == "Success" ? green : red;

                    table.AddCell(new iText.Layout.Element.Cell().SetBackgroundColor(bg).SetBorder(border).SetPadding(6)
                        .Add(new iText.Layout.Element.Paragraph(a.User?.Name ?? "System")
                            .SetFont(boldFont).SetFontSize(7).SetFontColor(darkText)));
                    table.AddCell(new iText.Layout.Element.Cell().SetBackgroundColor(bg).SetBorder(border).SetPadding(6)
                        .Add(new iText.Layout.Element.Paragraph(a.User?.EmployeeId ?? "—")
                            .SetFont(normalFont).SetFontSize(7).SetFontColor(grayText)));
                    table.AddCell(new iText.Layout.Element.Cell().SetBackgroundColor(bg).SetBorder(border).SetPadding(6)
                        .Add(new iText.Layout.Element.Paragraph(a.Action)
                            .SetFont(normalFont).SetFontSize(7).SetFontColor(darkText)));
                    table.AddCell(new iText.Layout.Element.Cell().SetBackgroundColor(bg).SetBorder(border).SetPadding(6)
                        .Add(new iText.Layout.Element.Paragraph(a.Module ?? "—")
                            .SetFont(normalFont).SetFontSize(7).SetFontColor(grayText)));
                    table.AddCell(new iText.Layout.Element.Cell().SetBackgroundColor(bg).SetBorder(border).SetPadding(6)
                        .Add(new iText.Layout.Element.Paragraph(a.CreatedAt.ToString("MM/dd HH:mm"))
                            .SetFont(normalFont).SetFontSize(7).SetFontColor(grayText)));
                    table.AddCell(new iText.Layout.Element.Cell().SetBackgroundColor(bg).SetBorder(border).SetPadding(6)
                        .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER)
                        .Add(new iText.Layout.Element.Paragraph(a.Status)
                            .SetFont(boldFont).SetFontSize(7).SetFontColor(statusColor)));
                    alt = !alt;
                }
                document.Add(table);
            }

            document.Add(new iText.Layout.Element.LineSeparator(
                new iText.Kernel.Pdf.Canvas.Draw.SolidLine(1f))
                .SetStrokeColor(borderClr).SetMarginTop(10).SetMarginBottom(8));
            document.Add(new iText.Layout.Element.Paragraph(
                $"This report was automatically generated by Nexum Banking ERP on {now:MMMM dd, yyyy} at {now:HH:mm} UTC. " +
                "This document is confidential and intended for authorized personnel only.")
                .SetFont(normalFont).SetFontSize(7).SetFontColor(grayText)
                .SetTextAlignment(iText.Layout.Properties.TextAlignment.CENTER));

            document.Close();

            var filename = $"{type}-report-{from:yyyyMMdd}-{now:yyyyMMdd}.pdf";
            return File(ms.ToArray(), "application/pdf", filename);
        }

        // GET /api/audit/dashboard/login-trend — all roles
        [HttpGet("dashboard/login-trend")]
        [Authorize(Policy = "BankTeller")]
        public async Task<IActionResult> LoginTrend()
        {
            var days = new List<object>();
            for (int i = 6; i >= 0; i--)
            {
                var date    = DateTime.UtcNow.Date.AddDays(-i);
                var next    = date.AddDays(1);
                var success = await _context.LoginAttempts
                    .CountAsync(l => l.AttemptedAt >= date && l.AttemptedAt < next && l.Status == "Success");
                var failed  = await _context.LoginAttempts
                    .CountAsync(l => l.AttemptedAt >= date && l.AttemptedAt < next && l.Status == "Failed");
                days.Add(new { day = date.ToString("ddd"), success, failed });
            }
            return Ok(days);
        }

        // GET /api/audit/dashboard/role-distribution — all roles
        [HttpGet("dashboard/role-distribution")]
        [Authorize(Policy = "BankTeller")]
        public async Task<IActionResult> RoleDistribution()
        {
            var roles = await _context.UserRoles
                .Include(ur => ur.Role)
                .Include(ur => ur.User)
                .Where(ur => ur.User.Status == "Active")
                .GroupBy(ur => ur.Role.Name)
                .Select(g => new { name = g.Key, value = g.Count() })
                .ToListAsync();
            return Ok(roles);
        }

        // GET /api/audit/dashboard/mfa-adoption — all roles
        [HttpGet("dashboard/mfa-adoption")]
        [Authorize(Policy = "BankTeller")]
        public async Task<IActionResult> MfaAdoption()
        {
            var months = new List<object>();
            for (int i = 5; i >= 0; i--)
            {
                var date     = DateTime.UtcNow.AddMonths(-i);
                var monthEnd = new DateTime(date.Year, date.Month,
                    DateTime.DaysInMonth(date.Year, date.Month));
                var total    = await _context.Users
                    .CountAsync(u => u.CreatedAt <= monthEnd && u.Status == "Active");
                var mfaCount = await _context.Users
                    .CountAsync(u => u.CreatedAt <= monthEnd && u.MfaEnabled && u.Status == "Active");
                var rate     = total > 0 ? (int)Math.Round((double)mfaCount / total * 100) : 0;
                months.Add(new { month = date.ToString("MMM"), rate });
            }
            return Ok(months);
        }

        // GET /api/audit/my-activity — any logged-in user
        [HttpGet("my-activity")]
        [Authorize]
        public async Task<IActionResult> GetMyActivity([FromQuery] int limit = 20)
        {
            var sub = User.FindFirst("sub")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(sub) || !Guid.TryParse(sub, out var userId))
                return Unauthorized();

            var logs = await _context.AuditLogs
                .Where(a => a.UserId == userId &&
                            !a.Action.StartsWith("GET ")    &&
                            !a.Action.StartsWith("POST ")   &&
                            !a.Action.StartsWith("PUT ")    &&
                            !a.Action.StartsWith("DELETE ") &&
                            !a.Action.StartsWith("PATCH "))
                .OrderByDescending(a => a.CreatedAt)
                .Take(limit)
                .Select(a => new {
                    a.Id, a.Action, a.Module,
                    a.Details, a.Status, a.IpAddress, a.CreatedAt,
                })
                .ToListAsync();

            var logins = await _context.LoginAttempts
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.AttemptedAt)
                .Take(10)
                .Select(l => new {
                    Id        = l.Id,
                    Action    = l.Status == "Success" ? "Login Success" : "Login Failed",
                    Module    = "Authentication",
                    Details   = $"IP: {l.IpAddress ?? "unknown"}",
                    Status    = l.Status,
                    IpAddress = l.IpAddress,
                    CreatedAt = l.AttemptedAt,
                })
                .ToListAsync();

            var combined = logs
                .Select(a => new { a.Action, a.Module, a.Details, a.Status, a.IpAddress, a.CreatedAt })
                .Concat(logins.Select(l => new { l.Action, l.Module, l.Details, l.Status, l.IpAddress, l.CreatedAt }))
                .OrderByDescending(x => x.CreatedAt)
                .Take(limit)
                .ToList();

            var totalLogins = await _context.LoginAttempts
                .CountAsync(l => l.UserId == userId && l.Status == "Success");
            var lastLogin = await _context.LoginAttempts
                .Where(l => l.UserId == userId && l.Status == "Success")
                .OrderByDescending(l => l.AttemptedAt)
                .Select(l => (DateTime?)l.AttemptedAt)
                .FirstOrDefaultAsync();
            var deviceCount = await _context.Devices
                .CountAsync(d => d.UserId == userId);

            return Ok(new {
                activities = combined,
                summary    = new { totalLogins, lastLogin, deviceCount }
            });
        }
    }
}