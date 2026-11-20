// Döljer konsolfönstret på Windows i släppta versioner
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    lararbordet_lib::run();
}
