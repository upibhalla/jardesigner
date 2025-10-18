//genesis
// kkit Version 11 flat dumpfile
 
// Saved on Sun Dec  8 18:59:38 2024
 
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
simundump geometry /kinetics/geometry[2] 0 1e-19 3 sphere "" white black 0 0 \
  0
simundump geometry /kinetics/geometry[3] 0 3.1e-20 3 sphere "" white black 0 \
  0 0
simundump text /kinetics/notes 0 ""
call /kinetics/notes LOAD \
""
simundump text /kinetics/geometry/notes 0 ""
call /kinetics/geometry/notes LOAD \
""
simundump text /kinetics/geometry[1]/notes 0 ""
call /kinetics/geometry[1]/notes LOAD \
""
simundump text /kinetics/geometry[2]/notes 0 ""
call /kinetics/geometry[2]/notes LOAD \
""
simundump group /kinetics/DEND 0 yellow black x 0 1 "" defaultfile \
  defaultfile.g 0 0 0 0 -2 0
simundump text /kinetics/DEND/notes 0 Compartment
call /kinetics/DEND/notes LOAD \
"Compartment"
simundump kpool /kinetics/DEND/phase 0 0.0 100 100 1.8669e+05 1.8669e+05 0 0 \
  1866.9 0 /kinetics/geometry 49 black 9 9 0
simundump text /kinetics/DEND/phase/notes 0 ""
call /kinetics/DEND/phase/notes LOAD \
""
simundump kpool /kinetics/DEND/CaIP3_3_R 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 20 black 4 7 0
simundump text /kinetics/DEND/CaIP3_3_R/notes 0 ""
call /kinetics/DEND/CaIP3_3_R/notes LOAD \
""
simundump kpool /kinetics/DEND/Serca 0 0.0 1.9999 1.9999 3733.7 3733.7 0 0 \
  1866.9 0 /kinetics/geometry 31 black 4 1 0
simundump text /kinetics/DEND/Serca/notes 0 ""
call /kinetics/DEND/Serca/notes LOAD \
""
simundump kenz /kinetics/DEND/Serca/MMenz_SERCA 0 0 0 0 0 1866.9 0.14284 32 8 \
  0 1 "" black 42 "" 4 2 0
simundump text /kinetics/DEND/Serca/MMenz_SERCA/notes 0 ""
call /kinetics/DEND/Serca/MMenz_SERCA/notes LOAD \
""
simundump kpool /kinetics/DEND/CaM 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 23 black 9 -1 0
simundump text /kinetics/DEND/CaM/notes 0 ""
call /kinetics/DEND/CaM/notes LOAD \
""
simundump kpool /kinetics/DEND/CaMCa 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 23 black 9 0 0
simundump text /kinetics/DEND/CaMCa/notes 0 ""
call /kinetics/DEND/CaMCa/notes LOAD \
""
simundump kpool /kinetics/DEND/CaMCa2 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 55 black 9 1 0
simundump text /kinetics/DEND/CaMCa2/notes 0 ""
call /kinetics/DEND/CaMCa2/notes LOAD \
""
simundump kpool /kinetics/DEND/CaMCa3 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 27 black 9 2 0
simundump text /kinetics/DEND/CaMCa3/notes 0 ""
call /kinetics/DEND/CaMCa3/notes LOAD \
""
simundump kpool /kinetics/DEND/CaMCa4 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 55 black 9 3 0
simundump text /kinetics/DEND/CaMCa4/notes 0 ""
call /kinetics/DEND/CaMCa4/notes LOAD \
""
simundump kpool /kinetics/DEND/IP3_R 0 0.0 0.1 0.1 186.69 186.69 0 0 1866.9 0 \
  /kinetics/geometry 22 black 3 9 0
simundump text /kinetics/DEND/IP3_R/notes 0 ""
call /kinetics/DEND/IP3_R/notes LOAD \
""
simundump kpool /kinetics/DEND/IP3_3_R 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 1 black 4 7 0
simundump text /kinetics/DEND/IP3_3_R/notes 0 ""
call /kinetics/DEND/IP3_3_R/notes LOAD \
""
simundump kpool /kinetics/DEND/IP3 0 0.0 0.1 0.1 186.69 186.69 0 0 1866.9 4 \
  /kinetics/geometry 53 black 5 9 0
simundump text /kinetics/DEND/IP3/notes 0 ""
call /kinetics/DEND/IP3/notes LOAD \
""
simundump kpool /kinetics/DEND/Ca2_IP3_3_R 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 25 black 7 9 0
simundump text /kinetics/DEND/Ca2_IP3_3_R/notes 0 ""
call /kinetics/DEND/Ca2_IP3_3_R/notes LOAD \
""
simundump kpool /kinetics/DEND/Mirror_CaIP3_3_R 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 4 black -1 4 0
simundump text /kinetics/DEND/Mirror_CaIP3_3_R/notes 0 ""
call /kinetics/DEND/Mirror_CaIP3_3_R/notes LOAD \
""
simundump kpool /kinetics/DEND/ActIP3R 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 8 black 2 1 0
simundump text /kinetics/DEND/ActIP3R/notes 0 ""
call /kinetics/DEND/ActIP3R/notes LOAD \
""
simundump kchan /kinetics/DEND/ActIP3R/chan 0 8 0.1 0 1 0 "" brown 8 2 2 0
simundump text /kinetics/DEND/ActIP3R/chan/notes 0 ""
call /kinetics/DEND/ActIP3R/chan/notes LOAD \
""
simundump kpool /kinetics/DEND/basal 0 0.0 0 0 0 0 0 0 1866.9 0 \
  /kinetics/geometry 8 black 2 -1 0
simundump text /kinetics/DEND/basal/notes 0 ""
call /kinetics/DEND/basal/notes LOAD \
""
simundump kpool /kinetics/DEND/BufPool 0 0.0 0 0 0 0 0 0 1866.9 4 \
  /kinetics/geometry 26 black 1 9 0
simundump text /kinetics/DEND/BufPool/notes 0 ""
call /kinetics/DEND/BufPool/notes LOAD \
""
simundump kreac /kinetics/DEND/CaMreac1 0 0.0045449 8.4853 "" white black 5 0 \
  0
simundump text /kinetics/DEND/CaMreac1/notes 0 ""
call /kinetics/DEND/CaMreac1/notes LOAD \
""
simundump kreac /kinetics/DEND/CaMreac2 0 0.0045449 8.4853 "" white black 6 1 \
  0
simundump text /kinetics/DEND/CaMreac2/notes 0 ""
call /kinetics/DEND/CaMreac2/notes LOAD \
""
simundump kreac /kinetics/DEND/CaMreac3 0 0.0019284 10 "" white black 7 2 0
simundump text /kinetics/DEND/CaMreac3/notes 0 ""
call /kinetics/DEND/CaMreac3/notes LOAD \
""
simundump kreac /kinetics/DEND/CaMreac4 0 0.00096419 10 "" white black 8 3 0
simundump text /kinetics/DEND/CaMreac4/notes 0 ""
call /kinetics/DEND/CaMreac4/notes LOAD \
""
simundump kreac /kinetics/DEND/Reac 0 0.0064279 8 "" white black 4 8 0
simundump text /kinetics/DEND/Reac/notes 0 ""
call /kinetics/DEND/Reac/notes LOAD \
""
simundump kreac /kinetics/DEND/Reac2 0 0.0080348 1.65 "" white black 6 6 0
simundump text /kinetics/DEND/Reac2/notes 0 ""
call /kinetics/DEND/Reac2/notes LOAD \
""
simundump kreac /kinetics/DEND/Reac4 0 0.00096422 0.21 "" white black 7 7 0
simundump text /kinetics/DEND/Reac4/notes 0 ""
call /kinetics/DEND/Reac4/notes LOAD \
""
simundump kreac /kinetics/DEND/Reac1 0 0.0001492 5 "" white black -1 0 0
simundump text /kinetics/DEND/Reac1/notes 0 ""
call /kinetics/DEND/Reac1/notes LOAD \
""
simundump kpool /kinetics/DEND/Ca 0 2e-11 0.079999 0.079999 149.35 149.35 0 0 \
  1866.9 0 /kinetics/geometry 23 black 7 4 0
simundump text /kinetics/DEND/Ca/notes 0 ""
call /kinetics/DEND/Ca/notes LOAD \
""
simundump kpool /kinetics/DEND/CaExtracell 0 0.0 0.079999 0.079999 149.35 \
  149.35 0 0 1866.9 4 /kinetics/geometry 61 black 9 4 0
simundump text /kinetics/DEND/CaExtracell/notes 0 ""
call /kinetics/DEND/CaExtracell/notes LOAD \
""
simundump kreac /kinetics/DEND/Ca_regn 0 0.1 0.1 "" white black 8 5 0
simundump text /kinetics/DEND/Ca_regn/notes 0 ""
call /kinetics/DEND/Ca_regn/notes LOAD \
""
simundump group /kinetics/DEND_ER 0 26 black x 0 0 "" DEND_ER defaultfile.g 0 \
  0 0 0 6 0
simundump text /kinetics/DEND_ER/notes 0 Compartment
call /kinetics/DEND_ER/notes LOAD \
"Compartment"
simundump kpool /kinetics/DEND_ER/CaER 0 0.0 408.59 408.59 95611 95611 0 0 \
  234 0 /kinetics/geometry 0 26 2 5 0
simundump text /kinetics/DEND_ER/CaER/notes 0 ""
call /kinetics/DEND_ER/CaER/notes LOAD \
""
simundump kpool /kinetics/DEND_ER/leakPool 0 0 1 1 234 234 0 0 234 0 \
  /kinetics/geometry[1] 45 26 4 4 0
simundump text /kinetics/DEND_ER/leakPool/notes 0 ""
call /kinetics/DEND_ER/leakPool/notes LOAD \
""
simundump kchan /kinetics/DEND_ER/leakPool/leakChan 0 0.04 0.1 0 1 0 "" brown \
  45 4 5 0
simundump text /kinetics/DEND_ER/leakPool/leakChan/notes 0 ""
call /kinetics/DEND_ER/leakPool/leakChan/notes LOAD \
""
simundump group /kinetics/SPINE 0 yellow black x 0 0 "" SPINE defaultfile.g 0 \
  0 0 0 11 0
simundump text /kinetics/SPINE/notes 0 Compartment
call /kinetics/SPINE/notes LOAD \
"Compartment"
simundump kpool /kinetics/SPINE/Ca 0 2e-11 0.08 0.08 4.8 4.8 0 0 60 0 \
  /kinetics/geometry[2] 25 yellow 4 11 0
simundump text /kinetics/SPINE/Ca/notes 0 ""
call /kinetics/SPINE/Ca/notes LOAD \
""
simundump group /kinetics/PSD 0 11 black x 0 0 "" PSD defaultfile.g 0 0 0 8 \
  11 0
simundump text /kinetics/PSD/notes 0 Compartment
call /kinetics/PSD/notes LOAD \
"Compartment"
simundump kpool /kinetics/PSD/Ca 0 2e-11 0 0 0 0 0 0 18.6 0 \
  /kinetics/geometry[3] 37 11 6 11 0
simundump text /kinetics/PSD/Ca/notes 0 ""
call /kinetics/PSD/Ca/notes LOAD \
""
simundump text /kinetics/geometry[3]/notes 0 ""
call /kinetics/geometry[3]/notes LOAD \
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
simundump xcoredraw /edit/draw 0 -3 11 -4 13
simundump xtree /edit/draw/tree 0 \
  /kinetics/#[],/kinetics/#[]/#[],/kinetics/#[]/#[]/#[][TYPE!=proto],/kinetics/#[]/#[]/#[][TYPE!=linkinfo]/##[] \
  "edit_elm.D <v>; drag_from_edit.w <d> <S> <x> <y> <z>" auto 0.6
simundump xtext /file/notes 0 1
addmsg /kinetics/DEND/Reac2 /kinetics/DEND/CaIP3_3_R REAC B A 
addmsg /kinetics/DEND/Reac4 /kinetics/DEND/CaIP3_3_R REAC A B 
addmsg /kinetics/DEND/Ca /kinetics/DEND/Serca/MMenz_SERCA SUBSTRATE n 
addmsg /kinetics/DEND/Serca /kinetics/DEND/Serca/MMenz_SERCA ENZYME n 
addmsg /kinetics/DEND/CaMreac1 /kinetics/DEND/CaM REAC A B 
addmsg /kinetics/DEND/CaMreac1 /kinetics/DEND/CaMCa REAC B A 
addmsg /kinetics/DEND/CaMreac2 /kinetics/DEND/CaMCa REAC A B 
addmsg /kinetics/DEND/CaMreac2 /kinetics/DEND/CaMCa2 REAC B A 
addmsg /kinetics/DEND/CaMreac3 /kinetics/DEND/CaMCa2 REAC A B 
addmsg /kinetics/DEND/CaMreac3 /kinetics/DEND/CaMCa3 REAC B A 
addmsg /kinetics/DEND/CaMreac4 /kinetics/DEND/CaMCa3 REAC A B 
addmsg /kinetics/DEND/CaMreac4 /kinetics/DEND/CaMCa4 REAC B A 
addmsg /kinetics/DEND/Reac /kinetics/DEND/IP3_R REAC A B 
addmsg /kinetics/DEND/Reac /kinetics/DEND/IP3_3_R REAC B A 
addmsg /kinetics/DEND/Reac2 /kinetics/DEND/IP3_3_R REAC A B 
addmsg /kinetics/DEND/Reac /kinetics/DEND/IP3 REAC A B 
addmsg /kinetics/DEND/Reac4 /kinetics/DEND/Ca2_IP3_3_R REAC B A 
addmsg /kinetics/DEND/CaIP3_3_R /kinetics/DEND/Mirror_CaIP3_3_R SUMTOTAL n nInit 
addmsg /kinetics/DEND/Reac1 /kinetics/DEND/Mirror_CaIP3_3_R REAC A B 
addmsg /kinetics/DEND/Reac1 /kinetics/DEND/Mirror_CaIP3_3_R REAC A B 
addmsg /kinetics/DEND/Reac1 /kinetics/DEND/Mirror_CaIP3_3_R REAC A B 
addmsg /kinetics/DEND/Reac1 /kinetics/DEND/ActIP3R REAC B A 
addmsg /kinetics/DEND/ActIP3R /kinetics/DEND/ActIP3R/chan NUMCHAN n 
addmsg /kinetics/DEND_ER/CaER /kinetics/DEND/ActIP3R/chan SUBSTRATE n vol 
addmsg /kinetics/DEND/Ca /kinetics/DEND/ActIP3R/chan PRODUCT n vol 
addmsg /kinetics/DEND/Ca /kinetics/DEND/CaMreac1 SUBSTRATE n 
addmsg /kinetics/DEND/CaM /kinetics/DEND/CaMreac1 SUBSTRATE n 
addmsg /kinetics/DEND/CaMCa /kinetics/DEND/CaMreac1 PRODUCT n 
addmsg /kinetics/DEND/CaMCa /kinetics/DEND/CaMreac2 SUBSTRATE n 
addmsg /kinetics/DEND/Ca /kinetics/DEND/CaMreac2 SUBSTRATE n 
addmsg /kinetics/DEND/CaMCa2 /kinetics/DEND/CaMreac2 PRODUCT n 
addmsg /kinetics/DEND/Ca /kinetics/DEND/CaMreac3 SUBSTRATE n 
addmsg /kinetics/DEND/CaMCa2 /kinetics/DEND/CaMreac3 SUBSTRATE n 
addmsg /kinetics/DEND/CaMCa3 /kinetics/DEND/CaMreac3 PRODUCT n 
addmsg /kinetics/DEND/Ca /kinetics/DEND/CaMreac4 SUBSTRATE n 
addmsg /kinetics/DEND/CaMCa3 /kinetics/DEND/CaMreac4 SUBSTRATE n 
addmsg /kinetics/DEND/CaMCa4 /kinetics/DEND/CaMreac4 PRODUCT n 
addmsg /kinetics/DEND/IP3_R /kinetics/DEND/Reac SUBSTRATE n 
addmsg /kinetics/DEND/IP3 /kinetics/DEND/Reac SUBSTRATE n 
addmsg /kinetics/DEND/IP3_3_R /kinetics/DEND/Reac PRODUCT n 
addmsg /kinetics/DEND/Ca /kinetics/DEND/Reac2 SUBSTRATE n 
addmsg /kinetics/DEND/IP3_3_R /kinetics/DEND/Reac2 SUBSTRATE n 
addmsg /kinetics/DEND/CaIP3_3_R /kinetics/DEND/Reac2 PRODUCT n 
addmsg /kinetics/DEND/Ca /kinetics/DEND/Reac4 SUBSTRATE n 
addmsg /kinetics/DEND/CaIP3_3_R /kinetics/DEND/Reac4 SUBSTRATE n 
addmsg /kinetics/DEND/Ca2_IP3_3_R /kinetics/DEND/Reac4 PRODUCT n 
addmsg /kinetics/DEND/Mirror_CaIP3_3_R /kinetics/DEND/Reac1 SUBSTRATE n 
addmsg /kinetics/DEND/Mirror_CaIP3_3_R /kinetics/DEND/Reac1 SUBSTRATE n 
addmsg /kinetics/DEND/Mirror_CaIP3_3_R /kinetics/DEND/Reac1 SUBSTRATE n 
addmsg /kinetics/DEND/ActIP3R /kinetics/DEND/Reac1 PRODUCT n 
addmsg /kinetics/DEND/CaMreac1 /kinetics/DEND/Ca REAC A B 
addmsg /kinetics/DEND/CaMreac2 /kinetics/DEND/Ca REAC A B 
addmsg /kinetics/DEND/CaMreac3 /kinetics/DEND/Ca REAC A B 
addmsg /kinetics/DEND/CaMreac4 /kinetics/DEND/Ca REAC A B 
addmsg /kinetics/DEND/Reac2 /kinetics/DEND/Ca REAC A B 
addmsg /kinetics/DEND/Reac4 /kinetics/DEND/Ca REAC A B 
addmsg /kinetics/DEND/Serca/MMenz_SERCA /kinetics/DEND/Ca REAC sA B 
addmsg /kinetics/DEND_ER/leakPool/leakChan /kinetics/DEND/Ca REAC B A 
addmsg /kinetics/DEND/ActIP3R/chan /kinetics/DEND/Ca REAC B A 
addmsg /kinetics/DEND/Ca_regn /kinetics/DEND/Ca REAC A B 
addmsg /kinetics/DEND/Ca_regn /kinetics/DEND/CaExtracell REAC B A 
addmsg /kinetics/DEND/Ca /kinetics/DEND/Ca_regn SUBSTRATE n 
addmsg /kinetics/DEND/CaExtracell /kinetics/DEND/Ca_regn PRODUCT n 
addmsg /kinetics/DEND/Serca/MMenz_SERCA /kinetics/DEND_ER/CaER MM_PRD pA 
addmsg /kinetics/DEND_ER/leakPool/leakChan /kinetics/DEND_ER/CaER REAC A B 
addmsg /kinetics/DEND/ActIP3R/chan /kinetics/DEND_ER/CaER REAC A B 
addmsg /kinetics/DEND_ER/leakPool /kinetics/DEND_ER/leakPool/leakChan NUMCHAN n 
addmsg /kinetics/DEND_ER/CaER /kinetics/DEND_ER/leakPool/leakChan SUBSTRATE n vol 
addmsg /kinetics/DEND/Ca /kinetics/DEND_ER/leakPool/leakChan PRODUCT n vol 
addmsg /kinetics/DEND/Ca /graphs/conc1/CaCyt.Co PLOT Co *CaCyt.Co *23 
addmsg /kinetics/DEND/ActIP3R /graphs/conc1/ActIP3R.Co PLOT Co *ActIP3R.Co *8 
addmsg /kinetics/DEND/CaIP3_3_R /graphs/conc1/CaIP3_3_R.Co PLOT Co *CaIP3_3_R.Co *20 
addmsg /kinetics/DEND_ER/CaER /graphs/conc2/CaER.Co PLOT Co *CaER.Co *0 
enddump
// End of dump

call /kinetics/DEND/notes LOAD \
"Compartment"
call /kinetics/DEND_ER/notes LOAD \
"Compartment"
call /kinetics/SPINE/notes LOAD \
"Compartment"
call /kinetics/PSD/notes LOAD \
"Compartment"
complete_loading
