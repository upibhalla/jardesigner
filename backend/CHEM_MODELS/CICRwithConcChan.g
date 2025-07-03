//genesis
// kkit Version 11 flat dumpfile
 
// Saved on Sun Dec  8 15:16:05 2024
 
include kkit {argv 1}
 
FASTDT = 0.001
SIMDT = 0.001
CONTROLDT = 0.1
PLOTDT = 0.1
MAXTIME = 100
TRANSIENT_TIME = 2
VARIABLE_DT_FLAG = 0
DEFAULT_VOL = 3.1e-18
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
simundump geometry /kinetics/geometry 0 3.1115e-18 3 sphere "" white black 0 \
  0 0
simundump geometry /kinetics/geometry[1] 0 3.9e-19 3 sphere "" white black 0 \
  0 0
simundump group /kinetics/cicr 0 yellow black x 0 1 "" defaultfile \
  defaultfile.g 0 0 0 3 1 0
simundump text /kinetics/cicr/notes 0 Compartment
call /kinetics/cicr/notes LOAD \
"Compartment"
simundump kpool /kinetics/cicr/CaCyt 0 1e-11 0.079999 0.079999 149.35 149.35 \
  0 0 1866.9 0 /kinetics/geometry 23 black 7 6 0
simundump text /kinetics/cicr/CaCyt/notes 0 ""
call /kinetics/cicr/CaCyt/notes LOAD \
""
simundump kpool /kinetics/cicr/CaIP3_3_R 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 20 black 4 9 0
simundump text /kinetics/cicr/CaIP3_3_R/notes 0 ""
call /kinetics/cicr/CaIP3_3_R/notes LOAD \
""
simundump kpool /kinetics/cicr/CaER 0 0.0 408.59 408.59 95611 95611 0 0 234 0 \
  /kinetics/geometry 0 black 2 7 0
simundump text /kinetics/cicr/CaER/notes 0 ""
call /kinetics/cicr/CaER/notes LOAD \
""
simundump kpool /kinetics/cicr/Serca 0 0.0 1.9999 1.9999 3733.7 3733.7 0 0 \
  1866.9 0 /kinetics/geometry 31 black 4 3 0
simundump text /kinetics/cicr/Serca/notes 0 ""
call /kinetics/cicr/Serca/notes LOAD \
""
simundump kenz /kinetics/cicr/Serca/MMenz_SERCA 0 0 0 0 0 1866.9 0.14284 32 8 \
  0 1 "" black 42 "" 4 4 0
simundump text /kinetics/cicr/Serca/MMenz_SERCA/notes 0 ""
call /kinetics/cicr/Serca/MMenz_SERCA/notes LOAD \
""
simundump kpool /kinetics/cicr/CaM 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 23 black 9 1 0
simundump text /kinetics/cicr/CaM/notes 0 ""
call /kinetics/cicr/CaM/notes LOAD \
""
simundump kpool /kinetics/cicr/CaMCa 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 23 black 9 2 0
simundump text /kinetics/cicr/CaMCa/notes 0 ""
call /kinetics/cicr/CaMCa/notes LOAD \
""
simundump kpool /kinetics/cicr/CaMCa2 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 55 black 9 3 0
simundump text /kinetics/cicr/CaMCa2/notes 0 ""
call /kinetics/cicr/CaMCa2/notes LOAD \
""
simundump kpool /kinetics/cicr/CaMCa3 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 27 black 9 4 0
simundump text /kinetics/cicr/CaMCa3/notes 0 ""
call /kinetics/cicr/CaMCa3/notes LOAD \
""
simundump kpool /kinetics/cicr/CaMCa4 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 55 black 9 5 0
simundump text /kinetics/cicr/CaMCa4/notes 0 ""
call /kinetics/cicr/CaMCa4/notes LOAD \
""
simundump kpool /kinetics/cicr/IP3_R 0 0.0 0.1 0.1 186.69 186.69 0 0 1866.9 0 \
  /kinetics/geometry 22 black 3 11 0
simundump text /kinetics/cicr/IP3_R/notes 0 ""
call /kinetics/cicr/IP3_R/notes LOAD \
""
simundump kpool /kinetics/cicr/IP3_3_R 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 1 black 4 9 0
simundump text /kinetics/cicr/IP3_3_R/notes 0 ""
call /kinetics/cicr/IP3_3_R/notes LOAD \
""
simundump kpool /kinetics/cicr/IP3 0 0.0 7.9999 7.9999 14935 14935 0 0 1866.9 \
  4 /kinetics/geometry 53 black 5 11 0
simundump text /kinetics/cicr/IP3/notes 0 ""
call /kinetics/cicr/IP3/notes LOAD \
""
simundump kpool /kinetics/cicr/Ca2_IP3_3_R 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 25 black 7 11 0
simundump text /kinetics/cicr/Ca2_IP3_3_R/notes 0 ""
call /kinetics/cicr/Ca2_IP3_3_R/notes LOAD \
""
simundump kpool /kinetics/cicr/Mirror_CaIP3_3_R 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 4 black -1 6 0
simundump text /kinetics/cicr/Mirror_CaIP3_3_R/notes 0 ""
call /kinetics/cicr/Mirror_CaIP3_3_R/notes LOAD \
""
simundump kpool /kinetics/cicr/ActIP3R 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 8 black 2 3 0
simundump text /kinetics/cicr/ActIP3R/notes 0 ""
call /kinetics/cicr/ActIP3R/notes LOAD \
""
simundump kchan /kinetics/cicr/ActIP3R/chan 0 8 0.1 0 1 0 "" brown 8 2 4 0
simundump text /kinetics/cicr/ActIP3R/chan/notes 0 ""
call /kinetics/cicr/ActIP3R/chan/notes LOAD \
""
simundump kreac /kinetics/cicr/CaMreac1 0 0.0045449 8.4853 "" white black 5 2 \
  0
simundump text /kinetics/cicr/CaMreac1/notes 0 ""
call /kinetics/cicr/CaMreac1/notes LOAD \
""
simundump kreac /kinetics/cicr/CaMreac2 0 0.0045449 8.4853 "" white black 6 3 \
  0
simundump text /kinetics/cicr/CaMreac2/notes 0 ""
call /kinetics/cicr/CaMreac2/notes LOAD \
""
simundump kreac /kinetics/cicr/CaMreac3 0 0.0019284 10 "" white black 7 4 0
simundump text /kinetics/cicr/CaMreac3/notes 0 ""
call /kinetics/cicr/CaMreac3/notes LOAD \
""
simundump kreac /kinetics/cicr/CaMreac4 0 0.00096419 10 "" white black 8 5 0
simundump text /kinetics/cicr/CaMreac4/notes 0 ""
call /kinetics/cicr/CaMreac4/notes LOAD \
""
simundump kreac /kinetics/cicr/Reac 0 0.0064279 8 "" white black 4 10 0
simundump text /kinetics/cicr/Reac/notes 0 ""
call /kinetics/cicr/Reac/notes LOAD \
""
simundump kreac /kinetics/cicr/Reac2 0 0.0080348 1.65 "" white black 6 8 0
simundump text /kinetics/cicr/Reac2/notes 0 ""
call /kinetics/cicr/Reac2/notes LOAD \
""
simundump kreac /kinetics/cicr/Reac4 0 0.00096422 0.21 "" white black 7 9 0
simundump text /kinetics/cicr/Reac4/notes 0 ""
call /kinetics/cicr/Reac4/notes LOAD \
""
simundump kreac /kinetics/cicr/Reac1 0 0.0001492 5 "" white black 1 2 0
simundump text /kinetics/cicr/Reac1/notes 0 ""
call /kinetics/cicr/Reac1/notes LOAD \
""
simundump kpool /kinetics/cicr/leakPool 0 0 1 1 234 234 0 0 234 0 \
  /kinetics/geometry[1] 45 black 4 6 0
simundump text /kinetics/cicr/leakPool/notes 0 ""
call /kinetics/cicr/leakPool/notes LOAD \
""
simundump kchan /kinetics/cicr/leakPool/leakChan 0 0.04 0.1 0 1 0 "" brown 45 \
  4 7 0
simundump text /kinetics/cicr/leakPool/leakChan/notes 0 ""
call /kinetics/cicr/leakPool/leakChan/notes LOAD \
""
simundump text /kinetics/geometry/notes 0 ""
call /kinetics/geometry/notes LOAD \
""
simundump text /kinetics/geometry[1]/notes 0 ""
call /kinetics/geometry[1]/notes LOAD \
""
simundump xgraph /graphs/conc1 0 0 100 0.001 0.999 0
simundump xgraph /graphs/conc2 0 0 100 0 1 0
simundump xplot /graphs/conc1/CaCyt.Co 3 524288 \
  "delete_plot.w <s> <d>; edit_plot.D <w>" 23 0 0 1
simundump xplot /graphs/conc1/ActIP3R.Co 3 524288 \
  "delete_plot.w <s> <d>; edit_plot.D <w>" 8 0 0 1
simundump xplot /graphs/conc1/CaIP3_3_R.Co 3 524288 \
  "delete_plot.w <s> <d>; edit_plot.D <w>" 20 0 0 1
simundump xplot /graphs/conc2/CaER.Co 3 524288 \
  "delete_plot.w <s> <d>; edit_plot.D <w>" 0 0 0 1
simundump xgraph /moregraphs/conc3 0 0 100 0 1 0
simundump xgraph /moregraphs/conc4 0 0 100 0 1 0
simundump xcoredraw /edit/draw 0 -3 11 -3 11
simundump xtree /edit/draw/tree 0 \
  /kinetics/#[],/kinetics/#[]/#[],/kinetics/#[]/#[]/#[][TYPE!=proto],/kinetics/#[]/#[]/#[][TYPE!=linkinfo]/##[] \
  "edit_elm.D <v>; drag_from_edit.w <d> <S> <x> <y> <z>" auto 0.6
simundump xtext /file/notes 0 1
addmsg /kinetics/cicr/CaMreac1 /kinetics/cicr/CaCyt REAC A B 
addmsg /kinetics/cicr/CaMreac2 /kinetics/cicr/CaCyt REAC A B 
addmsg /kinetics/cicr/CaMreac3 /kinetics/cicr/CaCyt REAC A B 
addmsg /kinetics/cicr/CaMreac4 /kinetics/cicr/CaCyt REAC A B 
addmsg /kinetics/cicr/Reac2 /kinetics/cicr/CaCyt REAC A B 
addmsg /kinetics/cicr/Reac4 /kinetics/cicr/CaCyt REAC A B 
addmsg /kinetics/cicr/Serca/MMenz_SERCA /kinetics/cicr/CaCyt REAC sA B 
addmsg /kinetics/cicr/leakPool/leakChan /kinetics/cicr/CaCyt REAC B A 
addmsg /kinetics/cicr/ActIP3R/chan /kinetics/cicr/CaCyt REAC B A 
addmsg /kinetics/cicr/Reac2 /kinetics/cicr/CaIP3_3_R REAC B A 
addmsg /kinetics/cicr/Reac4 /kinetics/cicr/CaIP3_3_R REAC A B 
addmsg /kinetics/cicr/Serca/MMenz_SERCA /kinetics/cicr/CaER MM_PRD pA 
addmsg /kinetics/cicr/leakPool/leakChan /kinetics/cicr/CaER REAC A B 
addmsg /kinetics/cicr/ActIP3R/chan /kinetics/cicr/CaER REAC A B 
addmsg /kinetics/cicr/CaCyt /kinetics/cicr/Serca/MMenz_SERCA SUBSTRATE n 
addmsg /kinetics/cicr/Serca /kinetics/cicr/Serca/MMenz_SERCA ENZYME n 
addmsg /kinetics/cicr/CaMreac1 /kinetics/cicr/CaM REAC A B 
addmsg /kinetics/cicr/CaMreac1 /kinetics/cicr/CaMCa REAC B A 
addmsg /kinetics/cicr/CaMreac2 /kinetics/cicr/CaMCa REAC A B 
addmsg /kinetics/cicr/CaMreac2 /kinetics/cicr/CaMCa2 REAC B A 
addmsg /kinetics/cicr/CaMreac3 /kinetics/cicr/CaMCa2 REAC A B 
addmsg /kinetics/cicr/CaMreac3 /kinetics/cicr/CaMCa3 REAC B A 
addmsg /kinetics/cicr/CaMreac4 /kinetics/cicr/CaMCa3 REAC A B 
addmsg /kinetics/cicr/CaMreac4 /kinetics/cicr/CaMCa4 REAC B A 
addmsg /kinetics/cicr/Reac /kinetics/cicr/IP3_R REAC A B 
addmsg /kinetics/cicr/Reac /kinetics/cicr/IP3_3_R REAC B A 
addmsg /kinetics/cicr/Reac2 /kinetics/cicr/IP3_3_R REAC A B 
addmsg /kinetics/cicr/Reac /kinetics/cicr/IP3 REAC A B 
addmsg /kinetics/cicr/Reac4 /kinetics/cicr/Ca2_IP3_3_R REAC B A 
addmsg /kinetics/cicr/CaIP3_3_R /kinetics/cicr/Mirror_CaIP3_3_R SUMTOTAL n nInit 
addmsg /kinetics/cicr/Reac1 /kinetics/cicr/Mirror_CaIP3_3_R REAC A B 
addmsg /kinetics/cicr/Reac1 /kinetics/cicr/Mirror_CaIP3_3_R REAC A B 
addmsg /kinetics/cicr/Reac1 /kinetics/cicr/Mirror_CaIP3_3_R REAC A B 
addmsg /kinetics/cicr/Reac1 /kinetics/cicr/ActIP3R REAC B A 
addmsg /kinetics/cicr/ActIP3R /kinetics/cicr/ActIP3R/chan NUMCHAN n 
addmsg /kinetics/cicr/CaER /kinetics/cicr/ActIP3R/chan SUBSTRATE n vol 
addmsg /kinetics/cicr/CaCyt /kinetics/cicr/ActIP3R/chan PRODUCT n vol 
addmsg /kinetics/cicr/CaCyt /kinetics/cicr/CaMreac1 SUBSTRATE n 
addmsg /kinetics/cicr/CaM /kinetics/cicr/CaMreac1 SUBSTRATE n 
addmsg /kinetics/cicr/CaMCa /kinetics/cicr/CaMreac1 PRODUCT n 
addmsg /kinetics/cicr/CaMCa /kinetics/cicr/CaMreac2 SUBSTRATE n 
addmsg /kinetics/cicr/CaCyt /kinetics/cicr/CaMreac2 SUBSTRATE n 
addmsg /kinetics/cicr/CaMCa2 /kinetics/cicr/CaMreac2 PRODUCT n 
addmsg /kinetics/cicr/CaCyt /kinetics/cicr/CaMreac3 SUBSTRATE n 
addmsg /kinetics/cicr/CaMCa2 /kinetics/cicr/CaMreac3 SUBSTRATE n 
addmsg /kinetics/cicr/CaMCa3 /kinetics/cicr/CaMreac3 PRODUCT n 
addmsg /kinetics/cicr/CaCyt /kinetics/cicr/CaMreac4 SUBSTRATE n 
addmsg /kinetics/cicr/CaMCa3 /kinetics/cicr/CaMreac4 SUBSTRATE n 
addmsg /kinetics/cicr/CaMCa4 /kinetics/cicr/CaMreac4 PRODUCT n 
addmsg /kinetics/cicr/IP3_R /kinetics/cicr/Reac SUBSTRATE n 
addmsg /kinetics/cicr/IP3 /kinetics/cicr/Reac SUBSTRATE n 
addmsg /kinetics/cicr/IP3_3_R /kinetics/cicr/Reac PRODUCT n 
addmsg /kinetics/cicr/CaCyt /kinetics/cicr/Reac2 SUBSTRATE n 
addmsg /kinetics/cicr/IP3_3_R /kinetics/cicr/Reac2 SUBSTRATE n 
addmsg /kinetics/cicr/CaIP3_3_R /kinetics/cicr/Reac2 PRODUCT n 
addmsg /kinetics/cicr/CaCyt /kinetics/cicr/Reac4 SUBSTRATE n 
addmsg /kinetics/cicr/CaIP3_3_R /kinetics/cicr/Reac4 SUBSTRATE n 
addmsg /kinetics/cicr/Ca2_IP3_3_R /kinetics/cicr/Reac4 PRODUCT n 
addmsg /kinetics/cicr/Mirror_CaIP3_3_R /kinetics/cicr/Reac1 SUBSTRATE n 
addmsg /kinetics/cicr/Mirror_CaIP3_3_R /kinetics/cicr/Reac1 SUBSTRATE n 
addmsg /kinetics/cicr/Mirror_CaIP3_3_R /kinetics/cicr/Reac1 SUBSTRATE n 
addmsg /kinetics/cicr/ActIP3R /kinetics/cicr/Reac1 PRODUCT n 
addmsg /kinetics/cicr/leakPool /kinetics/cicr/leakPool/leakChan NUMCHAN n 
addmsg /kinetics/cicr/CaER /kinetics/cicr/leakPool/leakChan SUBSTRATE n vol 
addmsg /kinetics/cicr/CaCyt /kinetics/cicr/leakPool/leakChan PRODUCT n vol 
addmsg /kinetics/cicr/CaCyt /graphs/conc1/CaCyt.Co PLOT Co *CaCyt.Co *23 
addmsg /kinetics/cicr/ActIP3R /graphs/conc1/ActIP3R.Co PLOT Co *ActIP3R.Co *8 
addmsg /kinetics/cicr/CaIP3_3_R /graphs/conc1/CaIP3_3_R.Co PLOT Co *CaIP3_3_R.Co *20 
addmsg /kinetics/cicr/CaER /graphs/conc2/CaER.Co PLOT Co *CaER.Co *0 
enddump
// End of dump

call /kinetics/cicr/notes LOAD \
"Compartment"
complete_loading
