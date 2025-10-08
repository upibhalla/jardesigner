//genesis
// kkit Version 11 flat dumpfile
 
// Saved on Tue Oct  7 20:48:47 2025
 
include kkit {argv 1}
 
FASTDT = 0.001
SIMDT = 0.001
CONTROLDT = 0.1
PLOTDT = 0.1
MAXTIME = 100
TRANSIENT_TIME = 2
VARIABLE_DT_FLAG = 0
DEFAULT_VOL = 2.618e-19
VERSION = 11.0
setfield /file/modpath value ~/scripts/modules
kparms
 
//genesis

initdump -version 3 -ignoreorphans 1
simobjdump doqcsinfo filename accessname accesstype transcriber developer \
  citation species tissue cellcompartment methodology sources \
  model_implementation model_validation x y z
simobjdump table input output alloced step_mode stepsize x y z
simobjdump xtree path script namemode sizescale
simobjdump xcoredraw xmin xmax ymin ymax
simobjdump xtext editable
simobjdump xgraph xmin xmax ymin ymax overlay
simobjdump xplot pixflags script fg ysquish do_slope wy
simobjdump group xtree_fg_req xtree_textfg_req plotfield expanded movealone \
  link savename file version md5sum mod_save_flag x y z
simobjdump geometry size dim shape outside xtree_fg_req xtree_textfg_req x y \
  z
simobjdump kpool DiffConst CoInit Co n nInit mwt nMin vol slave_enable \
  geomname xtree_fg_req xtree_textfg_req x y z
simobjdump kreac kf kb notes xtree_fg_req xtree_textfg_req x y z
simobjdump kenz CoComplexInit CoComplex nComplexInit nComplex vol k1 k2 k3 \
  keepconc usecomplex notes xtree_fg_req xtree_textfg_req link x y z
simobjdump stim level1 width1 delay1 level2 width2 delay2 baselevel trig_time \
  trig_mode notes xtree_fg_req xtree_textfg_req is_running x y z
simobjdump xtab input output alloced step_mode stepsize notes editfunc \
  xtree_fg_req xtree_textfg_req baselevel last_x last_y is_running x y z
simobjdump kchan perm gmax Vm is_active use_nernst notes xtree_fg_req \
  xtree_textfg_req x y z
simobjdump transport input output alloced step_mode stepsize dt delay clock \
  kf xtree_fg_req xtree_textfg_req x y z
simobjdump proto x y z
simobjdump text str
simundump geometry /kinetics/geometry 0 2.6277e-19 3 sphere "" white black 0 \
  0 0
simundump text /kinetics/notes 0 Compartment
call /kinetics/notes LOAD \
"Compartment"
simundump kpool /kinetics/Ca 0 0.0 0.080001 0.080001 12.613 12.613 0 0 157.66 \
  0 /kinetics/geometry 62 yellow 7 3 0
simundump text /kinetics/Ca/notes 0 ""
call /kinetics/Ca/notes LOAD \
""
simundump kpool /kinetics/Ca_ext 0 0.0 0.080001 0.080001 12.613 12.613 0 0 \
  157.66 4 /kinetics/geometry 52 yellow 11 3 0
simundump text /kinetics/Ca_ext/notes 0 ""
call /kinetics/Ca_ext/notes LOAD \
""
simundump kpool /kinetics/RR_pool 0 0.0 3 3 472.98 472.98 0 0 157.66 0 \
  /kinetics/geometry 1 yellow 5 1 0
simundump text /kinetics/RR_pool/notes 0 ""
call /kinetics/RR_pool/notes LOAD \
""
simundump kpool /kinetics/vesicle_pool 0 0.0 2.0422 2.0422 321.97 321.97 0 0 \
  157.66 4 /kinetics/geometry 27 yellow 11 -1 0
simundump text /kinetics/vesicle_pool/notes 0 ""
call /kinetics/vesicle_pool/notes LOAD \
""
simundump kpool /kinetics/Docked 0 0.0 0 0 0 0 0 0 157.66 0 \
  /kinetics/geometry 54 blue 9 1 0
simundump text /kinetics/Docked/notes 0 ""
call /kinetics/Docked/notes LOAD \
""
simundump kpool /kinetics/Ca_RR 0 0.0 0 0 0 0 0 0 157.66 0 /kinetics/geometry \
  51 blue 7 1 0
simundump text /kinetics/Ca_RR/notes 0 ""
call /kinetics/Ca_RR/notes LOAD \
""
simundump kpool /kinetics/Buffer 0 0.0 2 2 315.32 315.32 0 0 157.66 0 \
  /kinetics/geometry 47 blue 3 3 0
simundump text /kinetics/Buffer/notes 0 ""
call /kinetics/Buffer/notes LOAD \
""
simundump kpool /kinetics/Ca4.Buffer 0 0.0 0 0 0 0 0 0 157.66 0 \
  /kinetics/geometry 50 blue 3 1 0
simundump text /kinetics/Ca4.Buffer/notes 0 ""
call /kinetics/Ca4.Buffer/notes LOAD \
""
simundump kreac /kinetics/remove_Ca 0 0.15405 0.046119 "" white yellow 9 4 0
simundump text /kinetics/remove_Ca/notes 0 ""
call /kinetics/remove_Ca/notes LOAD \
""
simundump kreac /kinetics/remove 0 49612 0 "" white yellow 9 0 0
simundump text /kinetics/remove/notes 0 ""
call /kinetics/remove/notes LOAD \
""
simundump kreac /kinetics/replenish_vesicle 0 0.39111 0.39111 "" white yellow \
  9 -2 0
simundump text /kinetics/replenish_vesicle/notes 0 ""
call /kinetics/replenish_vesicle/notes LOAD \
""
simundump kreac /kinetics/vesicle_release 0 0.00012069 0 "" white yellow 10 2 \
  0
simundump text /kinetics/vesicle_release/notes 0 \
  "High cooperativity, 4 or higher. Several refs: McDargh and O-Shaughnessy, BioRxiv 2021 Voleti, Jaczynska, Rizo, eLife 2020 Chen.... Scheller, Cell 1999"
call /kinetics/vesicle_release/notes LOAD \
"High cooperativity, 4 or higher. Several refs: McDargh and O-Shaughnessy, BioRxiv 2021 Voleti, Jaczynska, Rizo, eLife 2020 Chen.... Scheller, Cell 1999"
simundump kreac /kinetics/Ca_bind_RR 0 0.00041381 2.0857 "" white blue 6 2 0
simundump text /kinetics/Ca_bind_RR/notes 0 ""
call /kinetics/Ca_bind_RR/notes LOAD \
""
simundump kreac /kinetics/docking 0 459.75 0 "" white blue 8 2 0
simundump text /kinetics/docking/notes 0 ""
call /kinetics/docking/notes LOAD \
""
simundump kreac /kinetics/undocking 0 561.17 0 "" white blue 7 0 0
simundump text /kinetics/undocking/notes 0 ""
call /kinetics/undocking/notes LOAD \
""
simundump kreac /kinetics/Ca_bind_buffer 0 6.5697e-08 1000 "" white blue 4 2 \
  0
simundump text /kinetics/Ca_bind_buffer/notes 0 ""
call /kinetics/Ca_bind_buffer/notes LOAD \
""
simundump kpool /kinetics/Released 0 0.0 0 0 0 0 0 0 157.66 0 \
  /kinetics/geometry 7 yellow 11 1 0
simundump text /kinetics/Released/notes 0 ""
call /kinetics/Released/notes LOAD \
""
simundump text /kinetics/geometry/notes 0 ""
call /kinetics/geometry/notes LOAD \
""
simundump xgraph /graphs/conc1 0 0 99 0.001 0.999 0
simundump xgraph /graphs/conc2 0 0 100 0 1 0
simundump xgraph /moregraphs/conc3 0 0 100 0 1 0
simundump xgraph /moregraphs/conc4 0 0 100 0 1 0
simundump xcoredraw /edit/draw 0 1 13 -4 6
simundump xtree /edit/draw/tree 0 \
  /kinetics/#[],/kinetics/#[]/#[],/kinetics/#[]/#[]/#[][TYPE!=proto],/kinetics/#[]/#[]/#[][TYPE!=linkinfo]/##[] \
  "edit_elm.D <v>; drag_from_edit.w <d> <S> <x> <y> <z>" auto 0.6
simundump xtext /file/notes 0 1
addmsg /kinetics/remove_Ca /kinetics/Ca REAC A B 
addmsg /kinetics/remove_Ca /kinetics/Ca REAC A B 
addmsg /kinetics/remove /kinetics/Ca REAC B A 
addmsg /kinetics/remove /kinetics/Ca REAC B A 
addmsg /kinetics/vesicle_release /kinetics/Ca REAC A B 
addmsg /kinetics/vesicle_release /kinetics/Ca REAC A B 
addmsg /kinetics/Ca_bind_RR /kinetics/Ca REAC A B 
addmsg /kinetics/Ca_bind_RR /kinetics/Ca REAC A B 
addmsg /kinetics/docking /kinetics/Ca REAC B A 
addmsg /kinetics/docking /kinetics/Ca REAC B A 
addmsg /kinetics/Ca_bind_buffer /kinetics/Ca REAC A B 
addmsg /kinetics/Ca_bind_buffer /kinetics/Ca REAC A B 
addmsg /kinetics/Ca_bind_buffer /kinetics/Ca REAC A B 
addmsg /kinetics/Ca_bind_buffer /kinetics/Ca REAC A B 
addmsg /kinetics/remove_Ca /kinetics/Ca_ext REAC B A 
addmsg /kinetics/remove_Ca /kinetics/Ca_ext REAC B A 
addmsg /kinetics/replenish_vesicle /kinetics/RR_pool REAC B A 
addmsg /kinetics/Ca_bind_RR /kinetics/RR_pool REAC A B 
addmsg /kinetics/undocking /kinetics/RR_pool REAC B A 
addmsg /kinetics/remove /kinetics/vesicle_pool REAC B A 
addmsg /kinetics/replenish_vesicle /kinetics/vesicle_pool REAC A B 
addmsg /kinetics/vesicle_release /kinetics/Docked REAC A B 
addmsg /kinetics/docking /kinetics/Docked REAC B A 
addmsg /kinetics/undocking /kinetics/Docked REAC A B 
addmsg /kinetics/Ca_bind_RR /kinetics/Ca_RR REAC B A 
addmsg /kinetics/docking /kinetics/Ca_RR REAC A B 
addmsg /kinetics/Ca_bind_buffer /kinetics/Buffer REAC A B 
addmsg /kinetics/Ca_bind_buffer /kinetics/Ca4.Buffer REAC B A 
addmsg /kinetics/Ca /kinetics/remove_Ca SUBSTRATE n 
addmsg /kinetics/Ca /kinetics/remove_Ca SUBSTRATE n 
addmsg /kinetics/Ca_ext /kinetics/remove_Ca PRODUCT n 
addmsg /kinetics/Ca_ext /kinetics/remove_Ca PRODUCT n 
addmsg /kinetics/Released /kinetics/remove SUBSTRATE n 
addmsg /kinetics/Ca /kinetics/remove PRODUCT n 
addmsg /kinetics/Ca /kinetics/remove PRODUCT n 
addmsg /kinetics/vesicle_pool /kinetics/remove PRODUCT n 
addmsg /kinetics/vesicle_pool /kinetics/replenish_vesicle SUBSTRATE n 
addmsg /kinetics/RR_pool /kinetics/replenish_vesicle PRODUCT n 
addmsg /kinetics/Ca /kinetics/vesicle_release SUBSTRATE n 
addmsg /kinetics/Ca /kinetics/vesicle_release SUBSTRATE n 
addmsg /kinetics/Docked /kinetics/vesicle_release SUBSTRATE n 
addmsg /kinetics/Released /kinetics/vesicle_release PRODUCT n 
addmsg /kinetics/Ca /kinetics/Ca_bind_RR SUBSTRATE n 
addmsg /kinetics/Ca /kinetics/Ca_bind_RR SUBSTRATE n 
addmsg /kinetics/RR_pool /kinetics/Ca_bind_RR SUBSTRATE n 
addmsg /kinetics/Ca_RR /kinetics/Ca_bind_RR PRODUCT n 
addmsg /kinetics/Ca_RR /kinetics/docking SUBSTRATE n 
addmsg /kinetics/Ca /kinetics/docking PRODUCT n 
addmsg /kinetics/Ca /kinetics/docking PRODUCT n 
addmsg /kinetics/Docked /kinetics/docking PRODUCT n 
addmsg /kinetics/Docked /kinetics/undocking SUBSTRATE n 
addmsg /kinetics/RR_pool /kinetics/undocking PRODUCT n 
addmsg /kinetics/Ca /kinetics/Ca_bind_buffer SUBSTRATE n 
addmsg /kinetics/Ca /kinetics/Ca_bind_buffer SUBSTRATE n 
addmsg /kinetics/Ca /kinetics/Ca_bind_buffer SUBSTRATE n 
addmsg /kinetics/Ca /kinetics/Ca_bind_buffer SUBSTRATE n 
addmsg /kinetics/Buffer /kinetics/Ca_bind_buffer SUBSTRATE n 
addmsg /kinetics/Ca4.Buffer /kinetics/Ca_bind_buffer PRODUCT n 
addmsg /kinetics/remove /kinetics/Released REAC A B 
addmsg /kinetics/vesicle_release /kinetics/Released REAC B A 
enddump
// End of dump

call /kinetics/vesicle_release/notes LOAD \
"High cooperativity, 4 or higher. Several refs: McDargh and O-Shaughnessy, BioRxiv 2021 Voleti, Jaczynska, Rizo, eLife 2020 Chen.... Scheller, Cell 1999"
complete_loading
