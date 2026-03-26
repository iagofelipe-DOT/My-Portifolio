import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/+esm';


const supabaseUrl = 'https://wthlsjmxbhtnwacklwci.supabase.co';
const supabaseKey = 'sb_publishable_47AI3d72L4BwpftH8YL59A_C_4drqpw';

//Cria e EXPORTA a conexão
export const supabase = createClient(supabaseUrl, supabaseKey);