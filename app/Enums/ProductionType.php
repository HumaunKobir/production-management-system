<?php

namespace App\Enums;

enum ProductionType: string
{
    case RawToSemi = 'raw_to_semi';
    case SemiToFinished = 'semi_to_finished';
}
