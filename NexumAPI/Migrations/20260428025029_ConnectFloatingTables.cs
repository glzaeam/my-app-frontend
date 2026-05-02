using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexumAPI.Migrations
{
    /// <inheritdoc />
    public partial class ConnectFloatingTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "RoleId",
                table: "PasswordPolicies",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "MfaConfigs",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "ReviewedBy",
                table: "AccessRequests",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PasswordPolicies_RoleId",
                table: "PasswordPolicies",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_MfaConfigs_UserId",
                table: "MfaConfigs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessRequests_ReviewedBy",
                table: "AccessRequests",
                column: "ReviewedBy");

            migrationBuilder.AddForeignKey(
                name: "FK_AccessRequests_Users_ReviewedBy",
                table: "AccessRequests",
                column: "ReviewedBy",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_MfaConfigs_Users_UserId",
                table: "MfaConfigs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PasswordPolicies_Roles_RoleId",
                table: "PasswordPolicies",
                column: "RoleId",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AccessRequests_Users_ReviewedBy",
                table: "AccessRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_MfaConfigs_Users_UserId",
                table: "MfaConfigs");

            migrationBuilder.DropForeignKey(
                name: "FK_PasswordPolicies_Roles_RoleId",
                table: "PasswordPolicies");

            migrationBuilder.DropIndex(
                name: "IX_PasswordPolicies_RoleId",
                table: "PasswordPolicies");

            migrationBuilder.DropIndex(
                name: "IX_MfaConfigs_UserId",
                table: "MfaConfigs");

            migrationBuilder.DropIndex(
                name: "IX_AccessRequests_ReviewedBy",
                table: "AccessRequests");

            migrationBuilder.DropColumn(
                name: "RoleId",
                table: "PasswordPolicies");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "MfaConfigs");

            migrationBuilder.AlterColumn<string>(
                name: "ReviewedBy",
                table: "AccessRequests",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);
        }
    }
}
