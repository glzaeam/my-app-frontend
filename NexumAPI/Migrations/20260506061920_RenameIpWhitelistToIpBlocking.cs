using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexumAPI.Migrations
{
    /// <inheritdoc />
    public partial class RenameIpWhitelistToIpBlocking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IpWhitelistEnabled",
                table: "LoginSettings",
                newName: "IpBlockingEnabled");

            migrationBuilder.RenameColumn(
                name: "AllowedIps",
                table: "LoginSettings",
                newName: "BlockedIps");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IpBlockingEnabled",
                table: "LoginSettings",
                newName: "IpWhitelistEnabled");

            migrationBuilder.RenameColumn(
                name: "BlockedIps",
                table: "LoginSettings",
                newName: "AllowedIps");
        }
    }
}
