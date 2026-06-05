import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment configurations
const stagingUrl = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const stagingKey = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

const prodUrl = "https://rwnldjtevkheiwutxhgg.supabase.co";
const prodKey = "sb_publishable_CQWOt6VSUTH7jPdYJXiY2w_IjvhG1Ea";

async function run() {
  console.log("Checking Staging Database...");
  const stagingClient = createClient(stagingUrl, stagingKey);
  try {
    const { data, error } = await stagingClient.from('dispositivos_autorizados').select('*');
    if (error) {
      console.error("Staging Error:", error.message);
    } else {
      console.log("Staging Devices (Count: " + data.length + "):");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error("Staging Exception:", e);
  }

  console.log("\nChecking Production Database...");
  const prodClient = createClient(prodUrl, prodKey);
  try {
    const { data, error } = await prodClient.from('dispositivos_autorizados').select('*');
    if (error) {
      console.error("Production Error:", error.message);
    } else {
      console.log("Production Devices (Count: " + data.length + "):");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error("Production Exception:", e);
  }
}

run();
