<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PokemonController extends Controller
{
    public function index(Request $request)
    {
        $page = $request->query('page', 1);
        $limit = $request->query('limit', 20);

        $offset = ($page - 1) * $limit;

        //get pokemon list
        $response = Http::get('https://pokeapi.co/api/v2/pokemon', [
            'offset' => $offset,
            'limit' => $limit,
        ]);

        $pokemons = $response->json()['results'];
        $result = [];

        //get pokemon details
        foreach ($pokemons as $pokemon) {
            $detail = Http::get($pokemon['url'])->json();

            $result[] = [
                'name' => $detail['name'],
                'image' => $detail['sprites']['other']['official-artwork']['front_default'],
                'types' => collect($detail['types'])->pluck('type.name'),
                'height' => $detail['height'],
                'weight' => $detail['weight']
            ];
        }
        return response()->json($result);
    }
}