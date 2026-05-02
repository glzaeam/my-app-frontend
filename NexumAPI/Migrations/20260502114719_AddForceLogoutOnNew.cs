using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexumAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddForceLogoutOnNew : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ForceLogoutOnNew",
                table: "LoginSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ForceLogoutOnNew",
                table: "LoginSettings");
        }
    }
}
