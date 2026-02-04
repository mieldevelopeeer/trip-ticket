<?php

namespace App\Http\Controllers;

use App\Models\DepartmentCode;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class DeptCodeController extends Controller
{
    /**
     * Display a listing of department/office codes.
     */
    public function index()
    {
        $departments = DepartmentCode::query()
            ->orderBy('code')
            ->get(['id', 'code', 'name']);

        return Inertia::render('DeptCode/DeptCode', [
            'departments' => $departments->map(fn($dept) => [
                'id'    => $dept->id,
                'code'  => $dept->code,
                'name'  => $dept->name,
            ]),
        ]);
    }

    /**
     * Store a newly created department code.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'code' => [
                    'required',
                    'string',
                    'size:3',               // exactly 3 characters
                    'regex:/^[0-9]{3}$/',   // only digits 000-999
                    'unique:department_code,code',
                ],
                'name' => [
                    'required',
                    'string',
                    'max:80',
                    'min:2',
                ],
            ], [
                'code.required' => 'Department code is required.',
                'code.size' => 'Department code must be exactly 3 digits.',
                'code.regex' => 'Department code must contain only numbers (000-999).',
                'code.unique' => 'This department code already exists.',
                'name.required' => 'Department name is required.',
                'name.min' => 'Department name must be at least 2 characters.',
                'name.max' => 'Department name cannot exceed 80 characters.',
            ]);

            DepartmentCode::create($validated);

            return redirect()
                ->route('departments.index')
                ->with('success', 'Department code "' . $validated['code'] . '" has been created successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput();
        } catch (\Exception $e) {
            return back()
                ->with('error', 'An error occurred while creating the department code. Please try again.');
        }
    }

    /**
     * Update the specified department code.
     */
    public function update(Request $request, DepartmentCode $department)
    {
        try {
            $validated = $request->validate([
                'code' => [
                    'required',
                    'string',
                    'size:3',   
                    'regex:/^[0-9]{3}$/',
                    Rule::unique('department_code', 'code')->ignore($department->id),
                ],
                'name' => [
                    'required',
                    'string',
                    'max:80',
                    'min:2',
                ],
            ], [
                'code.required' => 'Department code is required.',
                'code.size' => 'Department code must be exactly 3 digits.',
                'code.regex' => 'Department code must contain only numbers (000-999).',
                'code.unique' => 'This department code already exists.',
                'name.required' => 'Department name is required.',
                'name.min' => 'Department name must be at least 2 characters.',
                'name.max' => 'Department name cannot exceed 80 characters.',
            ]);

            $department->update($validated);

            return redirect()
                ->route('departments.index')
                ->with('success', 'Department code "' . $validated['code'] . '" has been updated successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput();
        } catch (\Exception $e) {
            return back()
                ->with('error', 'An error occurred while updating the department code. Please try again.');
        }
    }

    /**
     * Delete the specified department code.
     */
    public function destroy(DepartmentCode $department)
    {
        try {
            // Optional: Check if this code is used in related records
            // Uncomment and adjust based on your relationships
            // if ($department->vehicles()->exists()) {
            //     return back()->with('error', 'Cannot delete department code "' . $department->code . '": it is currently in use.');
            // }
            
            // if ($department->trips()->exists()) {
            //     return back()->with('error', 'Cannot delete department code "' . $department->code . '": it is currently in use.');
            // }

            $code = $department->code;
            $department->delete();

            return redirect()
                ->route('departments.index')
                ->with('success', 'Department code "' . $code . '" has been deleted successfully.');
        } catch (\Exception $e) {
            return back()
                ->with('error', 'An error occurred while deleting the department code. Please try again.');
        }
    }
}