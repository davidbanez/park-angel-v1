import React, { useState, useMemo } from 'react'
import { Button } from './Button'
import { Input } from './Input'

export interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  searchable?: boolean
  sortable?: boolean
  pagination?: boolean
  pageSize?: number
  exportable?: boolean
  onExport?: (format: 'csv' | 'excel') => void
  loading?: boolean
  emptyMessage?: string
  className?: string
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  searchable = false,
  sortable = true,
  pagination = true,
  pageSize = 10,
  exportable = false,
  onExport,
  loading = false,
  emptyMessage = 'No data available.',
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredData = useMemo(() => {
    if (!searchTerm) return data

    return data.filter(row =>
      columns.some(column => {
        const value = row[column.key]
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      })
    )
  }, [data, columns, searchTerm])

  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1

      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' 
          ? aValue.getTime() - bValue.getTime() 
          : bValue.getTime() - aValue.getTime()
      }

      // String comparison
      const aStr = aValue.toString().toLowerCase()
      const bStr = bValue.toString().toLowerCase()
      
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortColumn, sortDirection])

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData

    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize, pagination])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  const handleSort = (columnKey: string) => {
    if (!sortable) return

    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const handleExport = (format: 'csv' | 'excel') => {
    if (onExport) {
      onExport(format)
    } else {
      // Default CSV export
      if (format === 'csv') {
        exportToCSV()
      }
    }
  }

  const exportToCSV = () => {
    const headers = columns.map(col => col.label).join(',')
    const rows = sortedData.map(row => 
      columns.map(col => {
        const value = row[col.key]
        // Escape commas and quotes in CSV
        if (value == null) return ''
        const stringValue = value.toString()
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    ).join('\n')
    
    const csvContent = `${headers}\n${rows}`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
      
      if (startPage > 1) {
        pages.push(1)
        if (startPage > 2) pages.push('...')
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Export Controls */}
      {(searchable || exportable) && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          {searchable && (
            <div className="flex-1 max-w-sm">
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Reset to first page when searching
                }}
                className="w-full"
              />
            </div>
          )}
          {exportable && (
            <div className="flex space-x-2">
              <Button
                onClick={() => handleExport('csv')}
                variant="outline"
                size="sm"
                disabled={sortedData.length === 0}
              >
                Export CSV
              </Button>
              <Button
                onClick={() => handleExport('excel')}
                variant="outline"
                size="sm"
                disabled={sortedData.length === 0}
              >
                Export Excel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      {searchTerm && (
        <div className="text-sm text-gray-600">
          {filteredData.length} result{filteredData.length !== 1 ? 's' : ''} found
          {filteredData.length !== data.length && ` (filtered from ${data.length} total)`}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.align === 'center' ? 'text-center' : 
                    column.align === 'right' ? 'text-right' : 'text-left'
                  } ${
                    column.sortable && sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className={`flex items-center space-x-1 ${
                    column.align === 'center' ? 'justify-center' : 
                    column.align === 'right' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>{column.label}</span>
                    {column.sortable && sortable && (
                      <span className="text-gray-400">
                        {sortColumn === column.key ? (
                          <span className="text-purple-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        ) : (
                          '↕'
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                {columns.map((column) => (
                  <td 
                    key={column.key} 
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                      column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : (row[column.key] ?? '-')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              First
            </Button>
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            
            <div className="flex space-x-1">
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2 text-sm text-gray-500">...</span>
                  ) : (
                    <Button
                      onClick={() => setCurrentPage(page as number)}
                      variant={currentPage === page ? 'primary' : 'outline'}
                      size="sm"
                      className={currentPage === page ? 'bg-purple-600 text-white' : ''}
                    >
                      {page}
                    </Button>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
            <Button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Last
            </Button>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {paginatedData.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-lg font-medium mb-2">
            {searchTerm ? 'No results found' : 'No data available'}
          </div>
          <div className="text-sm">
            {searchTerm ? 
              `No results found for "${searchTerm}". Try adjusting your search terms.` : 
              emptyMessage
            }
          </div>
          {searchTerm && (
            <Button
              onClick={() => {
                setSearchTerm('')
                setCurrentPage(1)
              }}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Clear Search
            </Button>
          )}
        </div>
      )}
    </div>
  )
}