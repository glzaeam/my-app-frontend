using System;

namespace NexumAPI.Helpers
{
    /// <summary>
    /// Helper class for handling pagination logic consistently across the API.
    /// Default page size is 10 items per page.
    /// </summary>
    public static class PaginationHelper
    {
        public const int DefaultPageSize = 10;
        public const int MaxPageSize = 100;

        /// <summary>
        /// Calculates the skip count for LINQ queries based on page number and page size.
        /// </summary>
        /// <param name="page">Page number (1-based). Defaults to 1 if invalid.</param>
        /// <param name="pageSize">Number of items per page. Defaults to 10 if not provided or invalid.</param>
        /// <returns>Skip count for LINQ Skip() method</returns>
        public static int CalculateSkip(int page, int pageSize = DefaultPageSize)
        {
            // Validate page number
            if (page < 1) page = 1;

            // Validate and constrain page size
            if (pageSize < 1) pageSize = DefaultPageSize;
            if (pageSize > MaxPageSize) pageSize = MaxPageSize;

            return (page - 1) * pageSize;
        }

        /// <summary>
        /// Gets the validated page size, ensuring it's within acceptable bounds.
        /// </summary>
        /// <param name="pageSize">Requested page size. Defaults to 10 if not provided or invalid.</param>
        /// <returns>Validated page size (between 1 and MaxPageSize)</returns>
        public static int ValidatePageSize(int pageSize = DefaultPageSize)
        {
            if (pageSize < 1) pageSize = DefaultPageSize;
            if (pageSize > MaxPageSize) pageSize = MaxPageSize;
            return pageSize;
        }

        /// <summary>
        /// Gets the current page number, ensuring it's at least 1.
        /// </summary>
        /// <param name="page">Requested page number</param>
        /// <returns>Validated page number (minimum 1)</returns>
        public static int ValidatePage(int page)
        {
            return page < 1 ? 1 : page;
        }

        /// <summary>
        /// Calculates total pages from total item count and page size.
        /// </summary>
        /// <param name="totalItems">Total number of items in the dataset</param>
        /// <param name="pageSize">Number of items per page. Defaults to 10.</param>
        /// <returns>Number of pages needed</returns>
        public static int CalculateTotalPages(int totalItems, int pageSize = DefaultPageSize)
        {
            pageSize = ValidatePageSize(pageSize);
            return totalItems == 0 ? 1 : (int)Math.Ceiling((double)totalItems / pageSize);
        }
    }

    /// <summary>
    /// Generic paginated response wrapper for API endpoints.
    /// </summary>
    /// <typeparam name="T">Type of items in the paginated result</typeparam>
    public class PaginatedResponse<T>
    {
        public List<T> Data { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
        public bool HasPreviousPage { get; set; }
        public bool HasNextPage { get; set; }

        public PaginatedResponse() { }

        public PaginatedResponse(List<T> data, int page, int pageSize, int totalItems)
        {
            Data = data;
            Page = page;
            PageSize = pageSize;
            TotalItems = totalItems;
            TotalPages = PaginationHelper.CalculateTotalPages(totalItems, pageSize);
            HasPreviousPage = page > 1;
            HasNextPage = page < TotalPages;
        }
    }
}
