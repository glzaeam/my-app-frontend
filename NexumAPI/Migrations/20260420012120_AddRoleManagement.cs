using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexumAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddRoleManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RoleHierarchies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ParentRoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChildRoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Level = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleHierarchies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoleHierarchies_Roles_ChildRoleId",
                        column: x => x.ChildRoleId,
                        principalTable: "Roles",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RoleHierarchies_Roles_ParentRoleId",
                        column: x => x.ParentRoleId,
                        principalTable: "Roles",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TransactionTrails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TxnId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Module = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PerformedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TargetUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransactionTrails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TransactionTrails_Users_PerformedBy",
                        column: x => x.PerformedBy,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TransactionTrails_Users_TargetUserId",
                        column: x => x.TargetUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_RoleHierarchies_ChildRoleId",
                table: "RoleHierarchies",
                column: "ChildRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_RoleHierarchies_ParentRoleId",
                table: "RoleHierarchies",
                column: "ParentRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_TransactionTrails_PerformedBy",
                table: "TransactionTrails",
                column: "PerformedBy");

            migrationBuilder.CreateIndex(
                name: "IX_TransactionTrails_TargetUserId",
                table: "TransactionTrails",
                column: "TargetUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RoleHierarchies");

            migrationBuilder.DropTable(
                name: "TransactionTrails");
        }
    }
}
