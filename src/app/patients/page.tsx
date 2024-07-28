'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import { useRouter } from 'next/navigation';
import { HiSearch, HiPlus, HiChevronDown, HiChevronUp, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { debounce } from 'lodash';

interface Name {
  given?: string[];
  family?: string;
  prefix?: string[];
  suffix?: string[];
}

interface Telecom {
  system: string;
  value: string;
  use?: string;
  rank?: number;
}

interface Address {
  city?: string;
  state?: string;
  country?: string;
  line?: string[];
  postalCode?: string;
}

interface PatientResource {
  id: string;
  name?: Name[];
  gender?: string;
  birthDate?: string;
  telecom?: Telecom[];
  address?: Address[];
  meta?: { lastUpdated?: string };
}

interface Patient {
  resource: PatientResource;
}

interface PatientData {
  patients: Patient[];
  total: number;
}

export default function PatientListPage() {
  const [data, setData] = useState<PatientData>({ patients: [], total: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [pageCount, setPageCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [currentPageSize, setCurrentPageSize] = useState<number>(10);
  const router = useRouter();

  const fetchPatients = async (pageIndex: number, pageSize: number, searchTerm: string) => {
    setLoading(true);
    try {
      console.log(`/api/patients?search=${encodeURIComponent(searchTerm)}&page=${pageIndex + 1}&pageSize=${pageSize}`)
      const response = await fetch(`/api/patients?search=${encodeURIComponent(searchTerm)}&page=${pageIndex + 1}&pageSize=${pageSize}`);
      const result = await response.json();
      setData(result);
      setPageCount(Math.ceil(result.total / pageSize));
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      // Optionally, set an error state here to display to the user
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (name?: Name[]): string => {
    if (!name || name.length === 0) return 'Unknown';
    const firstName = name[0].given?.join(' ') || '';
    const lastName = name[0].family || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const columns = useMemo(() => [
    {
      Header: 'Patient',
      accessor: (row: PatientResource) => getPatientName(row?.name),
      Cell: ({ value, row }: { value: string; row: { original: PatientResource } }) => (
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => router.push(`/patients/${row.original.id}/edit`)}
        >
          <img className="h-8 w-8 rounded-full mr-2" src={`https://ui-avatars.com/api/?name=${value}&background=random`} alt="" />
          {value}
        </div>
      ),
    },
    { 
      Header: 'Gender', 
      accessor: (row: PatientResource) => row?.gender || 'Unknown',
      Cell: ({ value, row }: { value: string; row: { original: PatientResource } }) => (
        <div 
          className="cursor-pointer"
          onClick={() => router.push(`/patients/new/${row.original.id}/edit`)}
        >
          {value}
        </div>
      ),
    },
    { 
      Header: 'Date of Birth', 
      accessor: (row: PatientResource) => row?.birthDate, 
      Cell: ({ value, row }: { value: string; row: { original: PatientResource } }) => (
        <div 
          className="cursor-pointer"
          onClick={() => router.push(`/patients/new/${row.original.id}/edit`)}
        >
          {formatDate(value)}
        </div>
      ),
    },
    { 
      Header: 'Address', 
      accessor: (row: PatientResource) => {
        const addressParts = [
          row?.address?.[0]?.city,
          row?.address?.[0]?.state,
        ].filter(part => !!part); // Remove all empty values
        const address = addressParts.join(','); // Join by ', '
        return address || '-'; // If result is empty, show '-'
      },
      Cell: ({ value, row }: { value: string; row: { original: PatientResource } }) => (
        <div 
          className="cursor-pointer"
          onClick={() => router.push(`/patients/${row.original.id}`)}
        >
          {value}
        </div>
      ),
    },
    { 
      Header: 'Last Updated', 
      accessor: (row: PatientResource) => row?.meta?.lastUpdated, 
      Cell: ({ value, row }: { value: string; row: { original: PatientResource } }) => (
        <div 
          className="cursor-pointer"
          onClick={() => router.push(`/patients/${row.original.id}`)}
        >
          {formatDate(value)}
        </div>
      ),
    }
  ], [router]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount: tablePageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize, globalFilter },
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data: data.patients,
      manualPagination: true,
      pageCount: pageCount,
      initialState: { pageIndex: currentPageIndex, pageSize: currentPageSize },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce searchTerm update
  useEffect(() => {
    const handler = debounce((nextValue) => {
      setDebouncedSearchTerm(nextValue);
    }, 1000); // 300ms debounce time

    handler(searchTerm);

    // Cleanup function to cancel the debounce on component unmount or when searchTerm changes
    return () => {
      handler.cancel();
    };
  }, [searchTerm]);

  useEffect(() => {
    console.log({
      pageIndex,
      pageSize,
      debouncedSearchTerm,
    })
    fetchPatients(pageIndex, pageSize,debouncedSearchTerm);
  }, [pageIndex, pageSize,debouncedSearchTerm ]);

  useEffect(() => {
    if (searchTerm) {
      gotoPage(0);
      setCurrentPageIndex(0);
    }
  }, [searchTerm, gotoPage]);

  const handlePageChange = (newPageIndex: number) => {
    setCurrentPageIndex(newPageIndex);
    gotoPage(newPageIndex);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="text-xl font-semibold text-gray-800 mb-2">Patient List</div>
      <div className="flex justify-between items-center mb-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search patients"
            className="w-full p-2 pl-10 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
        </div>
        <button 
          onClick={() => router.push('/patients/new')}
          className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center transition duration-150 ease-in-out"
        >
          <HiPlus className="mr-1 text-lg" /> Add New
        </button>
      </div>
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps(column.getSortByToggleProps())} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {column.render('Header')}
                    <span>
                      {column.isSorted ? (column.isSortedDesc ? <HiChevronDown className="ml-2 inline" /> : <HiChevronUp className="ml-2 inline" />) : ''}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className={loading ? 'opacity-50' : ''}>
            {loading && (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </td>
              </tr>
            )}
            {!loading && page.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} className="hover:bg-gray-50">
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()} className="px-4 py-2 whitespace-nowrap text-sm">
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="py-3 flex items-center justify-between">
        <div>
          {loading ? (
            <p className="text-sm text-gray-700">Loading...</p>
          ) : Array.isArray(data.patients) && data.patients.length < 1 ? (
            <p className="text-sm text-gray-700">No data found.</p>
          ) : (
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{pageIndex * pageSize + 1}</span> to <span className="font-medium">{Math.min((pageIndex + 1) * pageSize, data.total)}</span> of{' '}
              <span className="font-medium">{data.total}</span> results
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(pageIndex - 1)}
            disabled={!canPreviousPage || loading}
            className="px-4 py-2 border rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <HiChevronLeft className="h-5 w-5 mr-1" />
            Previous
          </button>
          <button
            onClick={() => handlePageChange(pageIndex + 1)}
            disabled={!canNextPage || loading}
            className="px-4 py-2 border rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Next
            <HiChevronRight className="h-5 w-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
