<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepartmentCode extends Model
{
    use HasFactory;

    protected $table = "department_code";
    protected $fillable =[
        'code',
        'name',
    ];

    protected $casts = [
        'code' => 'string', 
    ];
}
