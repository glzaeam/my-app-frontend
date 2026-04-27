using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexumAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddMfaConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AllowedMfaMethods",
                table: "Roles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "MfaRequired",
                table: "Roles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MfaRequirement",
                table: "Roles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "MfaConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SmsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    EmailEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AuthenticatorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    CodeExpiryMinutes = table.Column<int>(type: "int", nullable: false),
                    GraceLogins = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MfaConfigs", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MfaConfigs");

            migrationBuilder.DropColumn(
                name: "AllowedMfaMethods",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "MfaRequired",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "MfaRequirement",
                table: "Roles");
        }
    }
}
