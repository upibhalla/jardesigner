//genesis
// kkit Version 11 flat dumpfile
 
// Saved on Tue Oct  7 20:59:10 2025
 
include kkit {argv 1}
 
FASTDT = 0.001
SIMDT = 0.01
CONTROLDT = 10
PLOTDT = 1
MAXTIME = 500
TRANSIENT_TIME = 2
VARIABLE_DT_FLAG = 1
DEFAULT_VOL = 1.6667e-21
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
simundump geometry /kinetics/geometry 0 1e-15 3 sphere "" white black 0 0 0
simundump text /kinetics/notes 0 ""
call /kinetics/notes LOAD \
""
simundump group /kinetics/PKA 0 blue blue x 0 1 "" defaultfile \
  /home2/bhalla/scripts/modules/defaultfile_0.g 0 0 0 -16 -15 0
simundump text /kinetics/PKA/notes 0 \
  "General ref: Taylor et al Ann Rev Biochem 1990 59:971-1005\n"
call /kinetics/PKA/notes LOAD \
"General ref: Taylor et al Ann Rev Biochem 1990 59:971-1005" \
""
simundump kpool /kinetics/PKA/R2C2 0 0 0.5 0.5 3e+05 3e+05 0 0 6e+05 0 \
  /kinetics/geometry white blue -21 -23 0
simundump text /kinetics/PKA/R2C2/notes 0 \
  "This is the R2C2 complex, consisting of 2 catalytic (C)\nsubunits, and the R-dimer. See Taylor et al Ann Rev Biochem\n1990 59:971-1005 for a review.\nThe Doskeland and Ogreid review is better for numbers.\nAmount of PKA is about .5 uM."
call /kinetics/PKA/R2C2/notes LOAD \
"This is the R2C2 complex, consisting of 2 catalytic (C)" \
"subunits, and the R-dimer. See Taylor et al Ann Rev Biochem" \
"1990 59:971-1005 for a review." \
"The Doskeland and Ogreid review is better for numbers." \
"Amount of PKA is about .5 uM."
simundump kreac /kinetics/PKA/cAMP-bind-site-B1 0 9e-05 33 "" white blue -20 \
  -25 0
simundump text /kinetics/PKA/cAMP-bind-site-B1/notes 0 \
  "Hasler et al FASEB J 6:2734-2741 1992 say Kd =1e-7M\nfor type II, 5.6e-8 M for type I. Take mean\nwhich comes to 2e-13 #/cell\nSmith et al PNAS USA 78:3 1591-1595 1981 have better data.\nFirst kf/kb=2.1e7/M = 3.5e-5 (#/cell).\nOgreid and Doskeland Febs Lett 129:2 287-292 1981 have figs\nsuggesting time course of complete assoc is < 1 min."
call /kinetics/PKA/cAMP-bind-site-B1/notes LOAD \
"Hasler et al FASEB J 6:2734-2741 1992 say Kd =1e-7M" \
"for type II, 5.6e-8 M for type I. Take mean" \
"which comes to 2e-13 #/cell" \
"Smith et al PNAS USA 78:3 1591-1595 1981 have better data." \
"First kf/kb=2.1e7/M = 3.5e-5 (#/cell)." \
"Ogreid and Doskeland Febs Lett 129:2 287-292 1981 have figs" \
"suggesting time course of complete assoc is < 1 min."
simundump kreac /kinetics/PKA/cAMP-bind-site-B2 1 9e-05 33 "" white blue -18 \
  -25 0
simundump text /kinetics/PKA/cAMP-bind-site-B2/notes 0 \
  "For now let us set this to the same Km (1e-7M) as\nsite B. This gives kf/kb = .7e-7M * 1e6 / (6e5^2) : 1/(6e5^2)\n= 2e-13:2.77e-12\nSmith et al have better values. They say that this is\ncooperative, so the consts are now kf/kb =8.3e-4"
call /kinetics/PKA/cAMP-bind-site-B2/notes LOAD \
"For now let us set this to the same Km (1e-7M) as" \
"site B. This gives kf/kb = .7e-7M * 1e6 / (6e5^2) : 1/(6e5^2)" \
"= 2e-13:2.77e-12" \
"Smith et al have better values. They say that this is" \
"cooperative, so the consts are now kf/kb =8.3e-4"
simundump kreac /kinetics/PKA/cAMP-bind-site-A1 1 0.000125 110 "" white blue \
  -16 -25 0
simundump text /kinetics/PKA/cAMP-bind-site-A1/notes 0 ""
call /kinetics/PKA/cAMP-bind-site-A1/notes LOAD \
""
simundump kreac /kinetics/PKA/cAMP-bind-site-A2 1 0.000125 32.5 "" white blue \
  -14 -25 0
simundump text /kinetics/PKA/cAMP-bind-site-A2/notes 0 ""
call /kinetics/PKA/cAMP-bind-site-A2/notes LOAD \
""
simundump kreac /kinetics/PKA/Release-C1 1 60 3e-05 "" white blue -14 -21 0
simundump text /kinetics/PKA/Release-C1/notes 0 \
  "This has to be fast, as the activation of PKA by cAMP\nis also fast.\nkf was 10\n"
call /kinetics/PKA/Release-C1/notes LOAD \
"This has to be fast, as the activation of PKA by cAMP" \
"is also fast." \
"kf was 10" \
""
simundump kreac /kinetics/PKA/Release-C2 1 60 3e-05 "" white blue -14 -17 0
simundump text /kinetics/PKA/Release-C2/notes 0 ""
call /kinetics/PKA/Release-C2/notes LOAD \
""
simundump kpool /kinetics/PKA/PKA-inhibitor 1 0 0.25 0.25 1.5e+05 1.5e+05 0 0 \
  6e+05 0 /kinetics/geometry cyan blue -17 -19 0
simundump text /kinetics/PKA/PKA-inhibitor/notes 0 \
  "About 25% of PKA C subunit is dissociated in resting cells without\nhaving any noticable activity.\nDoskeland and Ogreid Int J biochem 13 pp1-19 suggest that this is\nbecause there is a corresponding amount of inhibitor protein."
call /kinetics/PKA/PKA-inhibitor/notes LOAD \
"About 25% of PKA C subunit is dissociated in resting cells without" \
"having any noticable activity." \
"Doskeland and Ogreid Int J biochem 13 pp1-19 suggest that this is" \
"because there is a corresponding amount of inhibitor protein."
simundump kreac /kinetics/PKA/inhib-PKA 1 0.0001 1 "" white blue -16 -21 0
simundump text /kinetics/PKA/inhib-PKA/notes 0 \
  "This has to be set to zero for matching the expts in vitro.\nIn vivo we need to consider the inhibition though.\n\n"
call /kinetics/PKA/inhib-PKA/notes LOAD \
"This has to be set to zero for matching the expts in vitro." \
"In vivo we need to consider the inhibition though." \
"" \
""
simundump kpool /kinetics/PKA/inhibited-PKA 1 0 0 0 0 0 0 0 6e+05 0 \
  /kinetics/geometry cyan blue -19 -19 0
simundump text /kinetics/PKA/inhibited-PKA/notes 0 ""
call /kinetics/PKA/inhibited-PKA/notes LOAD \
""
simundump kpool /kinetics/PKA/cAMP.R2C2 0 0 0 0 0 0 0 0 6e+05 0 \
  /kinetics/geometry white blue -19 -23 0
simundump text /kinetics/PKA/cAMP.R2C2/notes 0 "CoInit was .0624\n"
call /kinetics/PKA/cAMP.R2C2/notes LOAD \
"CoInit was .0624" \
""
simundump kpool /kinetics/PKA/cAMP2.R2C2 1 0 0 0 0 0 0 0 6e+05 0 \
  /kinetics/geometry white blue -17 -23 0
simundump text /kinetics/PKA/cAMP2.R2C2/notes 0 ""
call /kinetics/PKA/cAMP2.R2C2/notes LOAD \
""
simundump kpool /kinetics/PKA/cAMP3.R2C2 1 0 0 0 0 0 0 0 6e+05 0 \
  /kinetics/geometry white blue -15 -23 0
simundump text /kinetics/PKA/cAMP3.R2C2/notes 0 ""
call /kinetics/PKA/cAMP3.R2C2/notes LOAD \
""
simundump kpool /kinetics/PKA/cAMP4.R2C2 1 0 0 0 0 0 0 0 6e+05 0 \
  /kinetics/geometry white blue -13 -23 0
simundump text /kinetics/PKA/cAMP4.R2C2/notes 0 ""
call /kinetics/PKA/cAMP4.R2C2/notes LOAD \
""
simundump kpool /kinetics/PKA/cAMP4.R2C 1 0 0 0 0 0 0 0 6e+05 0 \
  /kinetics/geometry white blue -13 -19 0
simundump text /kinetics/PKA/cAMP4.R2C/notes 0 ""
call /kinetics/PKA/cAMP4.R2C/notes LOAD \
""
simundump kpool /kinetics/PKA/cAMP4.R2 1 0 0 0 0 0 0 0 6e+05 0 \
  /kinetics/geometry white blue -13 -15 0
simundump text /kinetics/PKA/cAMP4.R2/notes 0 \
  "Starts at 0.15 for the test of fig 6 in Smith et al, but we aren't using\nthat paper any more."
call /kinetics/PKA/cAMP4.R2/notes LOAD \
"Starts at 0.15 for the test of fig 6 in Smith et al, but we aren't using" \
"that paper any more."
simundump kpool /kinetics/cAMP 1 0 0 0 0 0 0 0 6e+05 2 /kinetics/geometry \
  green black -13 -27 0
simundump text /kinetics/cAMP/notes 0 "Key second messenger."
call /kinetics/cAMP/notes LOAD \
"Key second messenger."
simundump kpool /kinetics/PKA-active 1 0 0 0 0 0 0 0 6e+05 0 \
  /kinetics/geometry yellow black -15 -19 0
simundump text /kinetics/PKA-active/notes 0 ""
call /kinetics/PKA-active/notes LOAD \
""
simundump kenz /kinetics/PKA-active/phosph-PDE 1 0 0 0 0 6e+05 1e-05 36 9 0 0 \
  "" red yellow "" -6 -17 0
simundump text /kinetics/PKA-active/phosph-PDE/notes 0 \
  "See Bramson et al CRC crit rev Biochem 15:2 93-124.\nThe rates there are for peptide substrates and too fast.\nScaled down by a factor of 3 as per\nCohen et al FEBS Lett 76:182-86 (1977)."
call /kinetics/PKA-active/phosph-PDE/notes LOAD \
"See Bramson et al CRC crit rev Biochem 15:2 93-124." \
"The rates there are for peptide substrates and too fast." \
"Scaled down by a factor of 3 as per" \
"Cohen et al FEBS Lett 76:182-86 (1977)."
simundump group /kinetics/AC 1 blue blue x 0 1 "" defaultfile \
  /home2/bhalla/scripts/modules/defaultfile_0.g 0 0 0 -4 -15 0
simundump text /kinetics/AC/notes 0 \
  "Adenylyl cyclase, also known as adenylate cyclase.\nThere are some ten isoforms, but here I represent only\nthe canonical Gs-stimulated activity."
call /kinetics/AC/notes LOAD \
"Adenylyl cyclase, also known as adenylate cyclase." \
"There are some ten isoforms, but here I represent only" \
"the canonical Gs-stimulated activity."
simundump kpool /kinetics/AC/ATP 1 0 5000 5000 3e+09 3e+09 0 0 6e+05 4 \
  /kinetics/geometry red blue -1 -19 0
simundump text /kinetics/AC/ATP/notes 0 \
  "ATP is present in all cells between 2 and 10 mM. \nSee Lehninger. It is assumed buffered since the\nmetabolic activity will take care of its levels."
call /kinetics/AC/ATP/notes LOAD \
"ATP is present in all cells between 2 and 10 mM. " \
"See Lehninger. It is assumed buffered since the" \
"metabolic activity will take care of its levels."
simundump kpool /kinetics/AC/AMP 1 0 1000 1000 6e+08 6e+08 0 0 6e+05 4 \
  /kinetics/geometry pink blue -5 -19 0
simundump text /kinetics/AC/AMP/notes 0 \
  "Assumed buffered to 1 mM. Value is irrelevant\nto simulation."
call /kinetics/AC/AMP/notes LOAD \
"Assumed buffered to 1 mM. Value is irrelevant" \
"to simulation."
simundump kpool /kinetics/AC/cAMP-PDE 1 0 0.5 0.5 3e+05 3e+05 0 0 6e+05 0 \
  /kinetics/geometry green blue -7 -19 0
simundump text /kinetics/AC/cAMP-PDE/notes 0 \
  "The levels of the PDE are not known at this time. However,\nenough\nkinetic info and info about steady-state levels of cAMP\netc are around\nto make it possible to estimate this at about 0.5 uM."
call /kinetics/AC/cAMP-PDE/notes LOAD \
"The levels of the PDE are not known at this time. However," \
"enough" \
"kinetic info and info about steady-state levels of cAMP" \
"etc are around" \
"to make it possible to estimate this at about 0.5 uM."
simundump kenz /kinetics/AC/cAMP-PDE/PDE 1 0 0 0 0 6e+05 4.2e-06 40 10 0 0 "" \
  red green "" -7 -21 0
simundump text /kinetics/AC/cAMP-PDE/PDE/notes 0 \
  "Best rates are from Conti et al Biochem 34 7979-7987 1995.\nThough these\nare for the Sertoli cell form, it looks like they carry\nnicely into\nalternatively spliced brain form. See Sette et al\nJBC 269:28 18271-18274\nKm ~2 uM, Vmax est ~ 10 umol/min/mg for pure form.\nBrain protein is 93 kD but this was 67.\nSo k3 ~10, k2 ~40, k1 ~4.2e-6"
call /kinetics/AC/cAMP-PDE/PDE/notes LOAD \
"Best rates are from Conti et al Biochem 34 7979-7987 1995." \
"Though these" \
"are for the Sertoli cell form, it looks like they carry" \
"nicely into" \
"alternatively spliced brain form. See Sette et al" \
"JBC 269:28 18271-18274" \
"Km ~2 uM, Vmax est ~ 10 umol/min/mg for pure form." \
"Brain protein is 93 kD but this was 67." \
"So k3 ~10, k2 ~40, k1 ~4.2e-6"
simundump kpool /kinetics/AC/cAMP-PDE* 1 0 0 0 0 0 0 0 6e+05 0 \
  /kinetics/geometry green blue -3 -19 0
simundump text /kinetics/AC/cAMP-PDE*/notes 0 \
  "This form has about 2X activity as plain PDE. See Sette et al JBC 269:28\n18271-18274 1994."
call /kinetics/AC/cAMP-PDE*/notes LOAD \
"This form has about 2X activity as plain PDE. See Sette et al JBC 269:28" \
"18271-18274 1994."
simundump kenz /kinetics/AC/cAMP-PDE*/PDE* 1 0 0 0 0 6e+05 8.4e-06 80 20 0 0 \
  "" red green "" -3 -21 0
simundump text /kinetics/AC/cAMP-PDE*/PDE*/notes 0 \
  "This form has about twice the activity of the unphosphorylated form. See\nSette et al JBC 269:28 18271-18274 1994.\nWe'll ignore cGMP effects for now."
call /kinetics/AC/cAMP-PDE*/PDE*/notes LOAD \
"This form has about twice the activity of the unphosphorylated form. See" \
"Sette et al JBC 269:28 18271-18274 1994." \
"We'll ignore cGMP effects for now."
simundump kreac /kinetics/AC/dephosph-PDE 1 0.1 0 "" white blue -4 -17 0
simundump text /kinetics/AC/dephosph-PDE/notes 0 \
  "The rates for this are poorly constrained. In adipocytes (probably a\ndifferent PDE) the dephosphorylation is complete within 15 min, but\nthere are no intermediate time points so it could be much faster. Identity\nof phosphatase etc is still unknown."
call /kinetics/AC/dephosph-PDE/notes LOAD \
"The rates for this are poorly constrained. In adipocytes (probably a" \
"different PDE) the dephosphorylation is complete within 15 min, but" \
"there are no intermediate time points so it could be much faster. Identity" \
"of phosphatase etc is still unknown."
simundump kpool /kinetics/AC/Gs.AC 1 0 0 0 0 0 0 0 6e+05 0 /kinetics/geometry \
  yellow blue -1 -23 0
simundump text /kinetics/AC/Gs.AC/notes 0 \
  "This is the active form of the cyclase.\n"
call /kinetics/AC/Gs.AC/notes LOAD \
"This is the active form of the cyclase." \
""
simundump kenz /kinetics/AC/Gs.AC/cyclase 1 0 0 0 0 6e+05 7.5e-06 72 18 0 1 \
  "" red yellow "" -1 -21 0
simundump text /kinetics/AC/Gs.AC/cyclase/notes 0 \
  "See Feinstein et al PNAS 88:10173-10177,\nJacobowitz et al JBC 286(6):3829-3832\nSmigel, JBC 261(4):1976-1982 (1986)"
call /kinetics/AC/Gs.AC/cyclase/notes LOAD \
"See Feinstein et al PNAS 88:10173-10177," \
"Jacobowitz et al JBC 286(6):3829-3832" \
"Smigel, JBC 261(4):1976-1982 (1986)"
simundump kpool /kinetics/AC/AC 1 0 0.015 0.015 9000 9000 0 0 6e+05 0 \
  /kinetics/geometry yellow blue 1 -23 0
simundump text /kinetics/AC/AC/notes 0 \
  "AC is present at rather low levels. Here we use\n0.015 uM which is meant to lump various isoforms.\nNone of the isoforms nor the other specific regulators\nare included here.\nJacobowitz, PhD thesis."
call /kinetics/AC/AC/notes LOAD \
"AC is present at rather low levels. Here we use" \
"0.015 uM which is meant to lump various isoforms." \
"None of the isoforms nor the other specific regulators" \
"are included here." \
"Jacobowitz, PhD thesis."
simundump kreac /kinetics/AC/Gs-bind-AC 1 0.00083333 1 "" white blue 0 -21 0
simundump text /kinetics/AC/Gs-bind-AC/notes 0 \
  "Half-max at around 3nM = kb/kf from fig 5 in \nFeinstein et al PNAS USA 88 10173-10177 1991\nkf = kb/1800 = 5.56e-4 kb\nOfer Jacobowitz thesis (Mount Sinai 1995) data indicates\nit is more like 2 nM.\n"
call /kinetics/AC/Gs-bind-AC/notes LOAD \
"Half-max at around 3nM = kb/kf from fig 5 in " \
"Feinstein et al PNAS USA 88 10173-10177 1991" \
"kf = kb/1800 = 5.56e-4 kb" \
"Ofer Jacobowitz thesis (Mount Sinai 1995) data indicates" \
"it is more like 2 nM." \
""
simundump kpool /kinetics/GTP.Ga 1 0 0 0 0 0 0 0 6e+05 0 /kinetics/geometry \
  red yellow 3 -5 0
simundump text /kinetics/GTP.Ga/notes 0 \
  "Activated G protein. \nSupposed to be 15-40% of total Gs when max stim."
call /kinetics/GTP.Ga/notes LOAD \
"Activated G protein. " \
"Supposed to be 15-40% of total Gs when max stim."
simundump group /kinetics/Gs 1 blue black x 0 0 "" defaultfile \
  /home2/bhalla/scripts/modules/defaultfile_0.g 0 0 0 -4 3 0
simundump text /kinetics/Gs/notes 0 \
  "We assume GTP is present in fixed amounts, so we leave it out\nof the explicit equations in this model. Normally we would expect it\nto associate along with the G-Receptor-ligand complex.\nMost info is from Berstein et al JBC 267:12 8081-8088 1992\nStructure of rec activation of Gq from Fay et al Biochem 30 5066-5075 1991"
call /kinetics/Gs/notes LOAD \
"We assume GTP is present in fixed amounts, so we leave it out" \
"of the explicit equations in this model. Normally we would expect it" \
"to associate along with the G-Receptor-ligand complex." \
"Most info is from Berstein et al JBC 267:12 8081-8088 1992" \
"Structure of rec activation of Gq from Fay et al Biochem 30 5066-5075 1991"
simundump kpool /kinetics/Gs/R 1 0 0.083333 0.083333 50000 50000 0 0 6e+05 0 \
  /kinetics/geometry green blue -3 -1 0
simundump text /kinetics/Gs/R/notes 0 \
  "A typical number of receptors per cell is about 50000."
call /kinetics/Gs/R/notes LOAD \
"A typical number of receptors per cell is about 50000."
simundump kpool /kinetics/Gs/L.R 1 0 0 0 0 0 0 0 6e+05 0 /kinetics/geometry \
  green blue -1 -1 0
simundump text /kinetics/Gs/L.R/notes 0 "Ligand.Receptor complex\n"
call /kinetics/Gs/L.R/notes LOAD \
"Ligand.Receptor complex" \
""
simundump kreac /kinetics/Gs/L-bind-R 1 1.6667e-07 0.1 "" white blue -2 -3 0
simundump text /kinetics/Gs/L-bind-R/notes 0 \
  "Ligand binding to receptor.\n\nFrom Gether et al JBC 270:28268-28275 (1995) the binding\nto the purified receptor is at about 1 uM, but the\nconformational change only happens at 30 uM. We'll take\n1 uM for this, since it is already much weaker binding\nthan to the R.Gs complex. The time-course from this\npaper appears remarkably slow, based on physiological data\nI estimate more like 10 sec.\n"
call /kinetics/Gs/L-bind-R/notes LOAD \
"Ligand binding to receptor." \
"" \
"From Gether et al JBC 270:28268-28275 (1995) the binding" \
"to the purified receptor is at about 1 uM, but the" \
"conformational change only happens at 30 uM. We'll take" \
"1 uM for this, since it is already much weaker binding" \
"than to the R.Gs complex. The time-course from this" \
"paper appears remarkably slow, based on physiological data" \
"I estimate more like 10 sec." \
""
simundump kpool /kinetics/Gs/GDP.Gabc 1 0 1 1 6e+05 6e+05 0 0 6e+05 0 \
  /kinetics/geometry yellow blue 1 -1 0
simundump text /kinetics/Gs/GDP.Gabc/notes 0 \
  "The resting state of Gs: GDP bound to trimer.\n\nFrom Pang and Sternweis JBC 265:30 18707-12 1990 we get \nconc est 1.6 uM to 0.8 uM. We'll use 1 uM.\n"
call /kinetics/Gs/GDP.Gabc/notes LOAD \
"The resting state of Gs: GDP bound to trimer." \
"" \
"From Pang and Sternweis JBC 265:30 18707-12 1990 we get " \
"conc est 1.6 uM to 0.8 uM. We'll use 1 uM." \
""
simundump kpool /kinetics/Gs/L.R.GDP.Gabc 1 0 0 0 0 0 0 0 6e+05 0 \
  /kinetics/geometry orange blue -1 -5 0
simundump text /kinetics/Gs/L.R.GDP.Gabc/notes 0 \
  "This is the ternary complex, where all the action\nhappens. There are actually a lot more steps here, \nincluding a final step where the GTP binds the\nL.R.Ga complex and causes the release of GTP.Ga from\nthe L.R. For simplicity this is excluded."
call /kinetics/Gs/L.R.GDP.Gabc/notes LOAD \
"This is the ternary complex, where all the action" \
"happens. There are actually a lot more steps here, " \
"including a final step where the GTP binds the" \
"L.R.Ga complex and causes the release of GTP.Ga from" \
"the L.R. For simplicity this is excluded."
simundump kpool /kinetics/Gs/L 1 0 0 0 0 0 0 0 6e+05 4 /kinetics/geometry \
  green blue -3 -5 0
simundump text /kinetics/Gs/L/notes 0 \
  "This ligand could be any of several which bind\nto the beta adrenergic receptor and other G-protein\ncoupled receptors which activate AC. For the\nsake of argument, call it isoproterenol."
call /kinetics/Gs/L/notes LOAD \
"This ligand could be any of several which bind" \
"to the beta adrenergic receptor and other G-protein" \
"coupled receptors which activate AC. For the" \
"sake of argument, call it isoproterenol."
simundump kpool /kinetics/Gs/GDP.Ga 1 0 0 0 0 0 0 0 6e+05 0 \
  /kinetics/geometry yellow blue 3 -1 0
simundump text /kinetics/Gs/GDP.Ga/notes 0 \
  "The inactive GDP-bound form of Gs alpha."
call /kinetics/Gs/GDP.Ga/notes LOAD \
"The inactive GDP-bound form of Gs alpha."
simundump kpool /kinetics/Gs/Gbg 1 0 0 0 0 0 0 0 6e+05 0 /kinetics/geometry \
  yellow blue 1 -5 0
simundump text /kinetics/Gs/Gbg/notes 0 "The Gbetagamma dimer."
call /kinetics/Gs/Gbg/notes LOAD \
"The Gbetagamma dimer."
simundump kreac /kinetics/Gs/Activate-Gs 1 0.025 0 "" white blue 0 -7 0
simundump text /kinetics/Gs/Activate-Gs/notes 0 \
  "This step combines several stages in GTP.Galpha release.\n\nFrom Berstein et al activation is at .35 - 0.7/min\nFrom Fay et al Biochem 30 5066-5075 1991 kf = .01/sec.\nFrom Brandt and Ross JBC 261(4):1656-1664 (1986)\nand Ransan et al Biochem J 283(2):519-524 (1992) rates\naround 2.5/min to 1.5/min are better."
call /kinetics/Gs/Activate-Gs/notes LOAD \
"This step combines several stages in GTP.Galpha release." \
"" \
"From Berstein et al activation is at .35 - 0.7/min" \
"From Fay et al Biochem 30 5066-5075 1991 kf = .01/sec." \
"From Brandt and Ross JBC 261(4):1656-1664 (1986)" \
"and Ransan et al Biochem J 283(2):519-524 (1992) rates" \
"around 2.5/min to 1.5/min are better."
simundump kreac /kinetics/Gs/Trimerize-Gs 1 1e-05 0 "" white blue 2 -3 0
simundump text /kinetics/Gs/Trimerize-Gs/notes 0 \
  "Negligible back-reaction.\n"
call /kinetics/Gs/Trimerize-Gs/notes LOAD \
"Negligible back-reaction." \
""
simundump kreac /kinetics/Gs/GTPase 1 0.066667 0 "" white blue 4 -3 0
simundump text /kinetics/Gs/GTPase/notes 0 \
  "From Brandt and Ross JBC 261(4):1656-1664,\nrate is 4/min and is agonist independent.\nI treat this as irreversible."
call /kinetics/Gs/GTPase/notes LOAD \
"From Brandt and Ross JBC 261(4):1656-1664," \
"rate is 4/min and is agonist independent." \
"I treat this as irreversible."
simundump kpool /kinetics/Gs/R.GDP.Gabc 1 0 0 0 0 0 0 0 6e+05 0 \
  /kinetics/geometry green blue -5 -1 0
simundump text /kinetics/Gs/R.GDP.Gabc/notes 0 \
  "Fraction of R.GDP.Gabc is about 50%  of total R,\nfrom Fay et al. Biochemistry 30:5066-5075(1991)\nSince this is not the same receptor, this value is a bit\nuncertain.\n"
call /kinetics/Gs/R.GDP.Gabc/notes LOAD \
"Fraction of R.GDP.Gabc is about 50%  of total R," \
"from Fay et al. Biochemistry 30:5066-5075(1991)" \
"Since this is not the same receptor, this value is a bit" \
"uncertain." \
""
simundump kreac /kinetics/Gs/L-bind-R.Gabc 1 8.3333e-06 0.1 "" white blue -4 \
  -3 0
simundump text /kinetics/Gs/L-bind-R.Gabc/notes 0 \
  "From Seifert et al Mol. Pharmacol 56:348-358 (1999)\nThe EC50 for ISO is about 20 nM."
call /kinetics/Gs/L-bind-R.Gabc/notes LOAD \
"From Seifert et al Mol. Pharmacol 56:348-358 (1999)" \
"The EC50 for ISO is about 20 nM."
simundump kreac /kinetics/Gs/R-bind-Gabc 1 3.3333e-07 0.1 "" white blue -2 1 \
  0
simundump text /kinetics/Gs/R-bind-Gabc/notes 0 \
  "Receptor binding to Gs. Scale it to the same\nslow rates described by Fay et al for L.R to L.R.G.\nFrom detailed balance, Kd is 50."
call /kinetics/Gs/R-bind-Gabc/notes LOAD \
"Receptor binding to Gs. Scale it to the same" \
"slow rates described by Fay et al for L.R to L.R.G." \
"From detailed balance, Kd is 50."
simundump kreac /kinetics/Gs/L.R-bind-Gabc 1 1.6667e-05 0.1 "" white blue 0 \
  -3 0
simundump text /kinetics/Gs/L.R-bind-Gabc/notes 0 \
  "See Fay et al Biochem 30 5066-5075 1991.\nkf is 0.01/sec but does not account for Gs levels.\nkb is 0.0001/sec. The fraction of RG is about 50%, so\nwe can estimate Kd at about the same as for Gs basal levels.\n\nThis rate has to be faster since it has to feed GTP.Ga\ninto the system faster than the GTPase.\nWaldhoer et al Mol Pharmacol 53:808-818 1988\nsay affinity for A1adenosine/Gi is 10 nM."
call /kinetics/Gs/L.R-bind-Gabc/notes LOAD \
"See Fay et al Biochem 30 5066-5075 1991." \
"kf is 0.01/sec but does not account for Gs levels." \
"kb is 0.0001/sec. The fraction of RG is about 50%, so" \
"we can estimate Kd at about the same as for Gs basal levels." \
"" \
"This rate has to be faster since it has to feed GTP.Ga" \
"into the system faster than the GTPase." \
"Waldhoer et al Mol Pharmacol 53:808-818 1988" \
"say affinity for A1adenosine/Gi is 10 nM."
simundump text /kinetics/geometry/notes 0 ""
call /kinetics/geometry/notes LOAD \
""
simundump xgraph /graphs/conc1 0 0 5400.1 0 0.034747 0
simundump xgraph /graphs/conc2 0 0 5400.1 0 0.019835 0
simundump xplot /graphs/conc1/L.Co 3 524288 \
  "delete_plot.w <s> <d>; edit_plot.D <w>" green 0 0 1
simundump xplot /graphs/conc1/GTP.Ga.Co 3 524288 \
  "delete_plot.w <s> <d>; edit_plot.D <w>" red 0 0 1
simundump xplot /graphs/conc1/cAMP.Co 3 524288 \
  "delete_plot.w <s> <d>; edit_plot.D <w>" green 0 0 1
simundump xplot /graphs/conc1/PKA-active.Co 3 524288 \
  "delete_plot.w <s> <d>; edit_plot.D <w>" yellow 0 0 1
simundump xplot /graphs/conc2/Gs.AC.Co 3 524288 \
  "delete_plot.w <s> <d>; edit_plot.D <w>" yellow 0 0 1
simundump xgraph /moregraphs/conc3 0 0 5400.1 0 0.1 0
simundump xgraph /moregraphs/conc4 0 0 5400.1 0 0.1 0
simundump xcoredraw /edit/draw 0 -23 6 -29 5
simundump xtree /edit/draw/tree 0 \
  /kinetics/#[],/kinetics/#[]/#[],/kinetics/#[]/#[]/#[][TYPE!=proto],/kinetics/#[]/#[]/#[][TYPE!=linkinfo]/##[] \
  "edit_elm.D <v>; drag_from_edit.w <d> <S> <x> <y> <z>" auto 0.6
simundump xtext /file/notes 0 1
xtextload /file/notes \
""
addmsg /kinetics/PKA/cAMP-bind-site-B1 /kinetics/PKA/R2C2 REAC A B 
addmsg /kinetics/PKA/R2C2 /kinetics/PKA/cAMP-bind-site-B1 SUBSTRATE n 
addmsg /kinetics/PKA/cAMP.R2C2 /kinetics/PKA/cAMP-bind-site-B1 PRODUCT n 
addmsg /kinetics/cAMP /kinetics/PKA/cAMP-bind-site-B1 SUBSTRATE n 
addmsg /kinetics/PKA/cAMP.R2C2 /kinetics/PKA/cAMP-bind-site-B2 SUBSTRATE n 
addmsg /kinetics/cAMP /kinetics/PKA/cAMP-bind-site-B2 SUBSTRATE n 
addmsg /kinetics/PKA/cAMP2.R2C2 /kinetics/PKA/cAMP-bind-site-B2 PRODUCT n 
addmsg /kinetics/PKA/cAMP2.R2C2 /kinetics/PKA/cAMP-bind-site-A1 SUBSTRATE n 
addmsg /kinetics/cAMP /kinetics/PKA/cAMP-bind-site-A1 SUBSTRATE n 
addmsg /kinetics/PKA/cAMP3.R2C2 /kinetics/PKA/cAMP-bind-site-A1 PRODUCT n 
addmsg /kinetics/cAMP /kinetics/PKA/cAMP-bind-site-A2 SUBSTRATE n 
addmsg /kinetics/PKA/cAMP3.R2C2 /kinetics/PKA/cAMP-bind-site-A2 SUBSTRATE n 
addmsg /kinetics/PKA/cAMP4.R2C2 /kinetics/PKA/cAMP-bind-site-A2 PRODUCT n 
addmsg /kinetics/PKA/cAMP4.R2C2 /kinetics/PKA/Release-C1 SUBSTRATE n 
addmsg /kinetics/PKA-active /kinetics/PKA/Release-C1 PRODUCT n 
addmsg /kinetics/PKA/cAMP4.R2C /kinetics/PKA/Release-C1 PRODUCT n 
addmsg /kinetics/PKA/cAMP4.R2C /kinetics/PKA/Release-C2 SUBSTRATE n 
addmsg /kinetics/PKA-active /kinetics/PKA/Release-C2 PRODUCT n 
addmsg /kinetics/PKA/cAMP4.R2 /kinetics/PKA/Release-C2 PRODUCT n 
addmsg /kinetics/PKA/inhib-PKA /kinetics/PKA/PKA-inhibitor REAC A B 
addmsg /kinetics/PKA-active /kinetics/PKA/inhib-PKA SUBSTRATE n 
addmsg /kinetics/PKA/PKA-inhibitor /kinetics/PKA/inhib-PKA SUBSTRATE n 
addmsg /kinetics/PKA/inhibited-PKA /kinetics/PKA/inhib-PKA PRODUCT n 
addmsg /kinetics/PKA/inhib-PKA /kinetics/PKA/inhibited-PKA REAC B A 
addmsg /kinetics/PKA/cAMP-bind-site-B1 /kinetics/PKA/cAMP.R2C2 REAC B A 
addmsg /kinetics/PKA/cAMP-bind-site-B2 /kinetics/PKA/cAMP.R2C2 REAC A B 
addmsg /kinetics/PKA/cAMP-bind-site-B2 /kinetics/PKA/cAMP2.R2C2 REAC B A 
addmsg /kinetics/PKA/cAMP-bind-site-A1 /kinetics/PKA/cAMP2.R2C2 REAC A B 
addmsg /kinetics/PKA/cAMP-bind-site-A1 /kinetics/PKA/cAMP3.R2C2 REAC B A 
addmsg /kinetics/PKA/cAMP-bind-site-A2 /kinetics/PKA/cAMP3.R2C2 REAC A B 
addmsg /kinetics/PKA/cAMP-bind-site-A2 /kinetics/PKA/cAMP4.R2C2 REAC B A 
addmsg /kinetics/PKA/Release-C1 /kinetics/PKA/cAMP4.R2C2 REAC A B 
addmsg /kinetics/PKA/Release-C1 /kinetics/PKA/cAMP4.R2C REAC B A 
addmsg /kinetics/PKA/Release-C2 /kinetics/PKA/cAMP4.R2C REAC A B 
addmsg /kinetics/PKA/Release-C2 /kinetics/PKA/cAMP4.R2 REAC B A 
addmsg /kinetics/PKA/cAMP-bind-site-B1 /kinetics/cAMP REAC A B 
addmsg /kinetics/PKA/cAMP-bind-site-B2 /kinetics/cAMP REAC A B 
addmsg /kinetics/PKA/cAMP-bind-site-A1 /kinetics/cAMP REAC A B 
addmsg /kinetics/PKA/cAMP-bind-site-A2 /kinetics/cAMP REAC A B 
addmsg /kinetics/AC/Gs.AC/cyclase /kinetics/cAMP MM_PRD pA 
addmsg /kinetics/AC/cAMP-PDE*/PDE* /kinetics/cAMP REAC sA B 
addmsg /kinetics/AC/cAMP-PDE/PDE /kinetics/cAMP REAC sA B 
addmsg /kinetics/PKA/Release-C1 /kinetics/PKA-active REAC B A 
addmsg /kinetics/PKA/Release-C2 /kinetics/PKA-active REAC B A 
addmsg /kinetics/PKA/inhib-PKA /kinetics/PKA-active REAC A B 
addmsg /kinetics/PKA-active/phosph-PDE /kinetics/PKA-active REAC eA B 
addmsg /kinetics/PKA-active /kinetics/PKA-active/phosph-PDE ENZYME n 
addmsg /kinetics/AC/cAMP-PDE /kinetics/PKA-active/phosph-PDE SUBSTRATE n 
addmsg /kinetics/AC/Gs.AC/cyclase /kinetics/AC/ATP REAC sA B 
addmsg /kinetics/AC/cAMP-PDE*/PDE* /kinetics/AC/AMP MM_PRD pA 
addmsg /kinetics/AC/cAMP-PDE/PDE /kinetics/AC/AMP MM_PRD pA 
addmsg /kinetics/AC/cAMP-PDE/PDE /kinetics/AC/cAMP-PDE REAC eA B 
addmsg /kinetics/AC/dephosph-PDE /kinetics/AC/cAMP-PDE REAC B A 
addmsg /kinetics/PKA-active/phosph-PDE /kinetics/AC/cAMP-PDE REAC sA B 
addmsg /kinetics/AC/cAMP-PDE /kinetics/AC/cAMP-PDE/PDE ENZYME n 
addmsg /kinetics/cAMP /kinetics/AC/cAMP-PDE/PDE SUBSTRATE n 
addmsg /kinetics/AC/cAMP-PDE*/PDE* /kinetics/AC/cAMP-PDE* REAC eA B 
addmsg /kinetics/AC/dephosph-PDE /kinetics/AC/cAMP-PDE* REAC A B 
addmsg /kinetics/PKA-active/phosph-PDE /kinetics/AC/cAMP-PDE* MM_PRD pA 
addmsg /kinetics/AC/cAMP-PDE* /kinetics/AC/cAMP-PDE*/PDE* ENZYME n 
addmsg /kinetics/cAMP /kinetics/AC/cAMP-PDE*/PDE* SUBSTRATE n 
addmsg /kinetics/AC/cAMP-PDE* /kinetics/AC/dephosph-PDE SUBSTRATE n 
addmsg /kinetics/AC/cAMP-PDE /kinetics/AC/dephosph-PDE PRODUCT n 
addmsg /kinetics/AC/Gs-bind-AC /kinetics/AC/Gs.AC REAC B A 
addmsg /kinetics/AC/Gs.AC /kinetics/AC/Gs.AC/cyclase ENZYME n 
addmsg /kinetics/AC/ATP /kinetics/AC/Gs.AC/cyclase SUBSTRATE n 
addmsg /kinetics/AC/Gs-bind-AC /kinetics/AC/AC REAC A B 
addmsg /kinetics/AC/AC /kinetics/AC/Gs-bind-AC SUBSTRATE n 
addmsg /kinetics/AC/Gs.AC /kinetics/AC/Gs-bind-AC PRODUCT n 
addmsg /kinetics/GTP.Ga /kinetics/AC/Gs-bind-AC SUBSTRATE n 
addmsg /kinetics/AC/Gs-bind-AC /kinetics/GTP.Ga REAC A B 
addmsg /kinetics/Gs/GTPase /kinetics/GTP.Ga REAC A B 
addmsg /kinetics/Gs/Activate-Gs /kinetics/GTP.Ga REAC B A 
addmsg /kinetics/Gs/L-bind-R /kinetics/Gs/R REAC A B 
addmsg /kinetics/Gs/R-bind-Gabc /kinetics/Gs/R REAC A B 
addmsg /kinetics/Gs/L-bind-R /kinetics/Gs/L.R REAC B A 
addmsg /kinetics/Gs/L.R-bind-Gabc /kinetics/Gs/L.R REAC A B 
addmsg /kinetics/Gs/Activate-Gs /kinetics/Gs/L.R REAC B A 
addmsg /kinetics/Gs/R /kinetics/Gs/L-bind-R SUBSTRATE n 
addmsg /kinetics/Gs/L /kinetics/Gs/L-bind-R SUBSTRATE n 
addmsg /kinetics/Gs/L.R /kinetics/Gs/L-bind-R PRODUCT n 
addmsg /kinetics/Gs/Trimerize-Gs /kinetics/Gs/GDP.Gabc REAC B A 
addmsg /kinetics/Gs/L.R-bind-Gabc /kinetics/Gs/GDP.Gabc REAC A B 
addmsg /kinetics/Gs/R-bind-Gabc /kinetics/Gs/GDP.Gabc REAC A B 
addmsg /kinetics/Gs/L.R-bind-Gabc /kinetics/Gs/L.R.GDP.Gabc REAC B A 
addmsg /kinetics/Gs/L-bind-R.Gabc /kinetics/Gs/L.R.GDP.Gabc REAC B A 
addmsg /kinetics/Gs/Activate-Gs /kinetics/Gs/L.R.GDP.Gabc REAC A B 
addmsg /kinetics/Gs/L-bind-R /kinetics/Gs/L REAC A B 
addmsg /kinetics/Gs/L-bind-R.Gabc /kinetics/Gs/L REAC A B 
addmsg /kinetics/Gs/GTPase /kinetics/Gs/GDP.Ga REAC B A 
addmsg /kinetics/Gs/Trimerize-Gs /kinetics/Gs/GDP.Ga REAC A B 
addmsg /kinetics/Gs/Trimerize-Gs /kinetics/Gs/Gbg REAC A B 
addmsg /kinetics/Gs/Activate-Gs /kinetics/Gs/Gbg REAC B A 
addmsg /kinetics/Gs/L.R.GDP.Gabc /kinetics/Gs/Activate-Gs SUBSTRATE n 
addmsg /kinetics/Gs/Gbg /kinetics/Gs/Activate-Gs PRODUCT n 
addmsg /kinetics/Gs/L.R /kinetics/Gs/Activate-Gs PRODUCT n 
addmsg /kinetics/GTP.Ga /kinetics/Gs/Activate-Gs PRODUCT n 
addmsg /kinetics/Gs/GDP.Ga /kinetics/Gs/Trimerize-Gs SUBSTRATE n 
addmsg /kinetics/Gs/Gbg /kinetics/Gs/Trimerize-Gs SUBSTRATE n 
addmsg /kinetics/Gs/GDP.Gabc /kinetics/Gs/Trimerize-Gs PRODUCT n 
addmsg /kinetics/GTP.Ga /kinetics/Gs/GTPase SUBSTRATE n 
addmsg /kinetics/Gs/GDP.Ga /kinetics/Gs/GTPase PRODUCT n 
addmsg /kinetics/Gs/L-bind-R.Gabc /kinetics/Gs/R.GDP.Gabc REAC A B 
addmsg /kinetics/Gs/R-bind-Gabc /kinetics/Gs/R.GDP.Gabc REAC B A 
addmsg /kinetics/Gs/L /kinetics/Gs/L-bind-R.Gabc SUBSTRATE n 
addmsg /kinetics/Gs/L.R.GDP.Gabc /kinetics/Gs/L-bind-R.Gabc PRODUCT n 
addmsg /kinetics/Gs/R.GDP.Gabc /kinetics/Gs/L-bind-R.Gabc SUBSTRATE n 
addmsg /kinetics/Gs/GDP.Gabc /kinetics/Gs/R-bind-Gabc SUBSTRATE n 
addmsg /kinetics/Gs/R /kinetics/Gs/R-bind-Gabc SUBSTRATE n 
addmsg /kinetics/Gs/R.GDP.Gabc /kinetics/Gs/R-bind-Gabc PRODUCT n 
addmsg /kinetics/Gs/GDP.Gabc /kinetics/Gs/L.R-bind-Gabc SUBSTRATE n 
addmsg /kinetics/Gs/L.R /kinetics/Gs/L.R-bind-Gabc SUBSTRATE n 
addmsg /kinetics/Gs/L.R.GDP.Gabc /kinetics/Gs/L.R-bind-Gabc PRODUCT n 
addmsg /kinetics/Gs/L /graphs/conc1/L.Co PLOT Co *L.Co *green 
addmsg /kinetics/GTP.Ga /graphs/conc1/GTP.Ga.Co PLOT Co *GTP.Ga.Co *red 
addmsg /kinetics/cAMP /graphs/conc1/cAMP.Co PLOT Co *cAMP.Co *green 
addmsg /kinetics/PKA-active /graphs/conc1/PKA-active.Co PLOT Co *PKA-active.Co *yellow 
addmsg /kinetics/AC/Gs.AC /graphs/conc2/Gs.AC.Co PLOT Co *Gs.AC.Co *yellow 
enddump
// End of dump

call /kinetics/PKA/notes LOAD \
"General ref: Taylor et al Ann Rev Biochem 1990 59:971-1005" \
""
call /kinetics/PKA/R2C2/notes LOAD \
"This is the R2C2 complex, consisting of 2 catalytic (C)" \
"subunits, and the R-dimer. See Taylor et al Ann Rev Biochem" \
"1990 59:971-1005 for a review." \
"The Doskeland and Ogreid review is better for numbers." \
"Amount of PKA is about .5 uM."
call /kinetics/PKA/cAMP-bind-site-B1/notes LOAD \
"Hasler et al FASEB J 6:2734-2741 1992 say Kd =1e-7M" \
"for type II, 5.6e-8 M for type I. Take mean" \
"which comes to 2e-13 #/cell" \
"Smith et al PNAS USA 78:3 1591-1595 1981 have better data." \
"First kf/kb=2.1e7/M = 3.5e-5 (#/cell)." \
"Ogreid and Doskeland Febs Lett 129:2 287-292 1981 have figs" \
"suggesting time course of complete assoc is < 1 min."
call /kinetics/PKA/cAMP-bind-site-B2/notes LOAD \
"For now let us set this to the same Km (1e-7M) as" \
"site B. This gives kf/kb = .7e-7M * 1e6 / (6e5^2) : 1/(6e5^2)" \
"= 2e-13:2.77e-12" \
"Smith et al have better values. They say that this is" \
"cooperative, so the consts are now kf/kb =8.3e-4"
call /kinetics/PKA/Release-C1/notes LOAD \
"This has to be fast, as the activation of PKA by cAMP" \
"is also fast." \
"kf was 10" \
""
call /kinetics/PKA/PKA-inhibitor/notes LOAD \
"About 25% of PKA C subunit is dissociated in resting cells without" \
"having any noticable activity." \
"Doskeland and Ogreid Int J biochem 13 pp1-19 suggest that this is" \
"because there is a corresponding amount of inhibitor protein."
call /kinetics/PKA/inhib-PKA/notes LOAD \
"This has to be set to zero for matching the expts in vitro." \
"In vivo we need to consider the inhibition though." \
"" \
""
call /kinetics/PKA/cAMP.R2C2/notes LOAD \
"CoInit was .0624" \
""
call /kinetics/PKA/cAMP4.R2/notes LOAD \
"Starts at 0.15 for the test of fig 6 in Smith et al, but we aren't using" \
"that paper any more."
call /kinetics/cAMP/notes LOAD \
"Key second messenger."
call /kinetics/PKA-active/phosph-PDE/notes LOAD \
"See Bramson et al CRC crit rev Biochem 15:2 93-124." \
"The rates there are for peptide substrates and too fast." \
"Scaled down by a factor of 3 as per" \
"Cohen et al FEBS Lett 76:182-86 (1977)."
call /kinetics/AC/notes LOAD \
"Adenylyl cyclase, also known as adenylate cyclase." \
"There are some ten isoforms, but here I represent only" \
"the canonical Gs-stimulated activity."
call /kinetics/AC/ATP/notes LOAD \
"ATP is present in all cells between 2 and 10 mM. " \
"See Lehninger. It is assumed buffered since the" \
"metabolic activity will take care of its levels."
call /kinetics/AC/AMP/notes LOAD \
"Assumed buffered to 1 mM. Value is irrelevant" \
"to simulation."
call /kinetics/AC/cAMP-PDE/notes LOAD \
"The levels of the PDE are not known at this time. However," \
"enough" \
"kinetic info and info about steady-state levels of cAMP" \
"etc are around" \
"to make it possible to estimate this at about 0.5 uM."
call /kinetics/AC/cAMP-PDE/PDE/notes LOAD \
"Best rates are from Conti et al Biochem 34 7979-7987 1995." \
"Though these" \
"are for the Sertoli cell form, it looks like they carry" \
"nicely into" \
"alternatively spliced brain form. See Sette et al" \
"JBC 269:28 18271-18274" \
"Km ~2 uM, Vmax est ~ 10 umol/min/mg for pure form." \
"Brain protein is 93 kD but this was 67." \
"So k3 ~10, k2 ~40, k1 ~4.2e-6"
call /kinetics/AC/cAMP-PDE*/notes LOAD \
"This form has about 2X activity as plain PDE. See Sette et al JBC 269:28" \
"18271-18274 1994."
call /kinetics/AC/cAMP-PDE*/PDE*/notes LOAD \
"This form has about twice the activity of the unphosphorylated form. See" \
"Sette et al JBC 269:28 18271-18274 1994." \
"We'll ignore cGMP effects for now."
call /kinetics/AC/dephosph-PDE/notes LOAD \
"The rates for this are poorly constrained. In adipocytes (probably a" \
"different PDE) the dephosphorylation is complete within 15 min, but" \
"there are no intermediate time points so it could be much faster. Identity" \
"of phosphatase etc is still unknown."
call /kinetics/AC/Gs.AC/notes LOAD \
"This is the active form of the cyclase." \
""
call /kinetics/AC/Gs.AC/cyclase/notes LOAD \
"See Feinstein et al PNAS 88:10173-10177," \
"Jacobowitz et al JBC 286(6):3829-3832" \
"Smigel, JBC 261(4):1976-1982 (1986)"
call /kinetics/AC/AC/notes LOAD \
"AC is present at rather low levels. Here we use" \
"0.015 uM which is meant to lump various isoforms." \
"None of the isoforms nor the other specific regulators" \
"are included here." \
"Jacobowitz, PhD thesis."
call /kinetics/AC/Gs-bind-AC/notes LOAD \
"Half-max at around 3nM = kb/kf from fig 5 in " \
"Feinstein et al PNAS USA 88 10173-10177 1991" \
"kf = kb/1800 = 5.56e-4 kb" \
"Ofer Jacobowitz thesis (Mount Sinai 1995) data indicates" \
"it is more like 2 nM." \
""
call /kinetics/GTP.Ga/notes LOAD \
"Activated G protein. " \
"Supposed to be 15-40% of total Gs when max stim."
call /kinetics/Gs/notes LOAD \
"We assume GTP is present in fixed amounts, so we leave it out" \
"of the explicit equations in this model. Normally we would expect it" \
"to associate along with the G-Receptor-ligand complex." \
"Most info is from Berstein et al JBC 267:12 8081-8088 1992" \
"Structure of rec activation of Gq from Fay et al Biochem 30 5066-5075 1991"
call /kinetics/Gs/R/notes LOAD \
"A typical number of receptors per cell is about 50000."
call /kinetics/Gs/L.R/notes LOAD \
"Ligand.Receptor complex" \
""
call /kinetics/Gs/L-bind-R/notes LOAD \
"Ligand binding to receptor." \
"" \
"From Gether et al JBC 270:28268-28275 (1995) the binding" \
"to the purified receptor is at about 1 uM, but the" \
"conformational change only happens at 30 uM. We'll take" \
"1 uM for this, since it is already much weaker binding" \
"than to the R.Gs complex. The time-course from this" \
"paper appears remarkably slow, based on physiological data" \
"I estimate more like 10 sec." \
""
call /kinetics/Gs/GDP.Gabc/notes LOAD \
"The resting state of Gs: GDP bound to trimer." \
"" \
"From Pang and Sternweis JBC 265:30 18707-12 1990 we get " \
"conc est 1.6 uM to 0.8 uM. We'll use 1 uM." \
""
call /kinetics/Gs/L.R.GDP.Gabc/notes LOAD \
"This is the ternary complex, where all the action" \
"happens. There are actually a lot more steps here, " \
"including a final step where the GTP binds the" \
"L.R.Ga complex and causes the release of GTP.Ga from" \
"the L.R. For simplicity this is excluded."
call /kinetics/Gs/L/notes LOAD \
"This ligand could be any of several which bind" \
"to the beta adrenergic receptor and other G-protein" \
"coupled receptors which activate AC. For the" \
"sake of argument, call it isoproterenol."
call /kinetics/Gs/GDP.Ga/notes LOAD \
"The inactive GDP-bound form of Gs alpha."
call /kinetics/Gs/Gbg/notes LOAD \
"The Gbetagamma dimer."
call /kinetics/Gs/Activate-Gs/notes LOAD \
"This step combines several stages in GTP.Galpha release." \
"" \
"From Berstein et al activation is at .35 - 0.7/min" \
"From Fay et al Biochem 30 5066-5075 1991 kf = .01/sec." \
"From Brandt and Ross JBC 261(4):1656-1664 (1986)" \
"and Ransan et al Biochem J 283(2):519-524 (1992) rates" \
"around 2.5/min to 1.5/min are better."
call /kinetics/Gs/Trimerize-Gs/notes LOAD \
"Negligible back-reaction." \
""
call /kinetics/Gs/GTPase/notes LOAD \
"From Brandt and Ross JBC 261(4):1656-1664," \
"rate is 4/min and is agonist independent." \
"I treat this as irreversible."
call /kinetics/Gs/R.GDP.Gabc/notes LOAD \
"Fraction of R.GDP.Gabc is about 50%  of total R," \
"from Fay et al. Biochemistry 30:5066-5075(1991)" \
"Since this is not the same receptor, this value is a bit" \
"uncertain." \
""
call /kinetics/Gs/L-bind-R.Gabc/notes LOAD \
"From Seifert et al Mol. Pharmacol 56:348-358 (1999)" \
"The EC50 for ISO is about 20 nM."
call /kinetics/Gs/R-bind-Gabc/notes LOAD \
"Receptor binding to Gs. Scale it to the same" \
"slow rates described by Fay et al for L.R to L.R.G." \
"From detailed balance, Kd is 50."
call /kinetics/Gs/L.R-bind-Gabc/notes LOAD \
"See Fay et al Biochem 30 5066-5075 1991." \
"kf is 0.01/sec but does not account for Gs levels." \
"kb is 0.0001/sec. The fraction of RG is about 50%, so" \
"we can estimate Kd at about the same as for Gs basal levels." \
"" \
"This rate has to be faster since it has to feed GTP.Ga" \
"into the system faster than the GTPase." \
"Waldhoer et al Mol Pharmacol 53:808-818 1988" \
"say affinity for A1adenosine/Gi is 10 nM."
complete_loading
