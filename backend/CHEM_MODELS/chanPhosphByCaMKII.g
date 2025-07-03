//genesis
// kkit Version 11 flat dumpfile
 
// Saved on Sun Dec  8 16:28:01 2024
 
include kkit {argv 1}
 
FASTDT = 0.0001
SIMDT = 0.01
CONTROLDT = 5
PLOTDT = 1
MAXTIME = 100
TRANSIENT_TIME = 2
VARIABLE_DT_FLAG = 1
DEFAULT_VOL = 1e-20
VERSION = 11.0
setfield /file/modpath value /home2/bhalla/scripts/modules
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
simundump geometry /kinetics/geometry 0 1e-19 3 sphere "" white black 0 0 0
simundump group /kinetics/dend 0 yellow black x 0 0 "" defaultfile \
  defaultfile.g 0 0 0 3 4 0
simundump text /kinetics/dend/notes 0 Compartment
call /kinetics/dend/notes LOAD \
"Compartment"
simundump kpool /kinetics/dend/CaM 0 1e-11 5 5 300 300 0 0 60 0 \
  /kinetics/geometry 55 28 -2 2 0
simundump text /kinetics/dend/CaM/notes 0 ""
call /kinetics/dend/CaM/notes LOAD \
""
simundump kpool /kinetics/dend/Ca_CaM 0 1e-11 0 0 0 0 0 0 60 0 \
  /kinetics/geometry blue 28 1 -1 0
simundump text /kinetics/dend/Ca_CaM/notes 0 ""
call /kinetics/dend/Ca_CaM/notes LOAD \
""
simundump kpool /kinetics/dend/Ca 0 1e-10 0.08 0.08 4.8 4.8 0 0 60 4 \
  /kinetics/geometry blue 28 0 4 0
simundump text /kinetics/dend/Ca/notes 0 ""
call /kinetics/dend/Ca/notes LOAD \
""
simundump kreac /kinetics/dend/CaM_bind_CaMKII 0 0.0016667 1 "" white 28 1 -4 \
  0
simundump text /kinetics/dend/CaM_bind_CaMKII/notes 0 ""
call /kinetics/dend/CaM_bind_CaMKII/notes LOAD \
""
simundump kpool /kinetics/dend/CaMKII 0 0 8.3333 8.3333 500 500 0 0 60 0 \
  /kinetics/geometry 7 28 -1 -3 0
simundump text /kinetics/dend/CaMKII/notes 0 ""
call /kinetics/dend/CaMKII/notes LOAD \
""
simundump kpool /kinetics/dend/Ca_CaM_CaMKII 0 0 0 0 0 0 0 0 60 0 \
  /kinetics/geometry blue 0 4 -5 0
simundump text /kinetics/dend/Ca_CaM_CaMKII/notes 0 ""
call /kinetics/dend/Ca_CaM_CaMKII/notes LOAD \
""
simundump kenz /kinetics/dend/Ca_CaM_CaMKII/kinase 0 0 0 0 0 6 0.16667 8 2 0 \
  0 "" red blue "" 4 -4 0
simundump text /kinetics/dend/Ca_CaM_CaMKII/kinase/notes 0 ""
call /kinetics/dend/Ca_CaM_CaMKII/kinase/notes LOAD \
""
simundump kpool /kinetics/dend/chan 0 0 1 1 60 60 0 0 60 0 /kinetics/geometry \
  0 black 3 -1 0
simundump text /kinetics/dend/chan/notes 0 ""
call /kinetics/dend/chan/notes LOAD \
""
simundump kpool /kinetics/dend/chan_p 0 0 0 0 0 0 0 0 60 0 /kinetics/geometry \
  7 black 5 -1 0
simundump text /kinetics/dend/chan_p/notes 0 ""
call /kinetics/dend/chan_p/notes LOAD \
""
simundump kreac /kinetics/dend/Ca_bind_CaM 0 0.0027778 40 "" white 28 -1 0 0
simundump text /kinetics/dend/Ca_bind_CaM/notes 0 \
  "This should actually be 4th order in Ca. Using 2nd order here\nfor simplicity and to lessen numerical stiffness."
call /kinetics/dend/Ca_bind_CaM/notes LOAD \
"This should actually be 4th order in Ca. Using 2nd order here" \
"for simplicity and to lessen numerical stiffness."
simundump kreac /kinetics/dend/dephosph 0 1 0 "" white black 4 1 0
simundump text /kinetics/dend/dephosph/notes 0 ""
call /kinetics/dend/dephosph/notes LOAD \
""
simundump text /kinetics/geometry/notes 0 ""
call /kinetics/geometry/notes LOAD \
""
simundump xgraph /graphs/conc1 0 0 100 0 1 0
simundump xgraph /graphs/conc2 0 0 100 0 1.4023 0
simundump xplot /graphs/conc1/Ca.Co 3 524288 \
  "delete_plot.w <s> <d>; edit_plot.D <w>" blue 0 0 1
simundump xplot /graphs/conc2/chan_p.Co 3 524288 \
  "delete_plot.w <s> <d>; edit_plot.D <w>" 7 0 0 1
simundump xplot /graphs/conc2/Ca_CaM_CaMKII.Co 3 524288 \
  "delete_plot.w <s> <d>; edit_plot.D <w>" blue 0 0 1
simundump xgraph /moregraphs/conc3 0 0 100 0 1 0
simundump xgraph /moregraphs/conc4 0 0 100 0 1 0
simundump xcoredraw /edit/draw 0 -4 7 -7 6
simundump xtree /edit/draw/tree 0 \
  /kinetics/#[],/kinetics/#[]/#[],/kinetics/#[]/#[]/#[][TYPE!=proto],/kinetics/#[]/#[]/#[][TYPE!=linkinfo]/##[] \
  "edit_elm.D <v>; drag_from_edit.w <d> <S> <x> <y> <z>" auto 0.6
simundump xtext /file/notes 0 1
xtextload /file/notes \
"Very simplified calcium-to-kinase model for a test multiscale" \
"model."
addmsg /kinetics/dend/Ca_bind_CaM /kinetics/dend/CaM REAC A B 
addmsg /kinetics/dend/Ca_bind_CaM /kinetics/dend/Ca_CaM REAC B A 
addmsg /kinetics/dend/CaM_bind_CaMKII /kinetics/dend/Ca_CaM REAC A B 
addmsg /kinetics/dend/Ca_bind_CaM /kinetics/dend/Ca REAC A B 
addmsg /kinetics/dend/Ca_bind_CaM /kinetics/dend/Ca REAC A B 
addmsg /kinetics/dend/Ca_CaM /kinetics/dend/CaM_bind_CaMKII SUBSTRATE n 
addmsg /kinetics/dend/CaMKII /kinetics/dend/CaM_bind_CaMKII SUBSTRATE n 
addmsg /kinetics/dend/Ca_CaM_CaMKII /kinetics/dend/CaM_bind_CaMKII PRODUCT n 
addmsg /kinetics/dend/CaM_bind_CaMKII /kinetics/dend/CaMKII REAC A B 
addmsg /kinetics/dend/CaM_bind_CaMKII /kinetics/dend/Ca_CaM_CaMKII REAC B A 
addmsg /kinetics/dend/Ca_CaM_CaMKII/kinase /kinetics/dend/Ca_CaM_CaMKII REAC eA B 
addmsg /kinetics/dend/Ca_CaM_CaMKII /kinetics/dend/Ca_CaM_CaMKII/kinase ENZYME n 
addmsg /kinetics/dend/chan /kinetics/dend/Ca_CaM_CaMKII/kinase SUBSTRATE n 
addmsg /kinetics/dend/Ca_CaM_CaMKII/kinase /kinetics/dend/chan REAC sA B 
addmsg /kinetics/dend/dephosph /kinetics/dend/chan REAC B A 
addmsg /kinetics/dend/Ca_CaM_CaMKII/kinase /kinetics/dend/chan_p MM_PRD pA 
addmsg /kinetics/dend/dephosph /kinetics/dend/chan_p REAC A B 
addmsg /kinetics/dend/Ca /kinetics/dend/Ca_bind_CaM SUBSTRATE n 
addmsg /kinetics/dend/Ca /kinetics/dend/Ca_bind_CaM SUBSTRATE n 
addmsg /kinetics/dend/CaM /kinetics/dend/Ca_bind_CaM SUBSTRATE n 
addmsg /kinetics/dend/Ca_CaM /kinetics/dend/Ca_bind_CaM PRODUCT n 
addmsg /kinetics/dend/chan_p /kinetics/dend/dephosph SUBSTRATE n 
addmsg /kinetics/dend/chan /kinetics/dend/dephosph PRODUCT n 
addmsg /kinetics/dend/Ca /graphs/conc1/Ca.Co PLOT Co *Ca.Co *blue 
addmsg /kinetics/dend/chan_p /graphs/conc2/chan_p.Co PLOT Co *chan_p.Co *7 
addmsg /kinetics/dend/Ca_CaM_CaMKII /graphs/conc2/Ca_CaM_CaMKII.Co PLOT Co *Ca_CaM_CaMKII.Co *blue 
enddump
// End of dump

call /kinetics/dend/notes LOAD \
"Compartment"
call /kinetics/dend/Ca_bind_CaM/notes LOAD \
"This should actually be 4th order in Ca. Using 2nd order here" \
"for simplicity and to lessen numerical stiffness."
complete_loading
