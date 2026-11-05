'use client'

import * as React from 'react'
import {
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Check,
  Receipt,
  FileCode2,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useImageVision } from './vision/use-image-vision'
import { useVisionItems } from './vision/use-vision-items'
import { VisionStepModels } from './vision/vision-step-models'
import { VisionStepUpload } from './vision/vision-step-upload'
import { VisionStepModes } from './vision/vision-step-modes'
import { VisionResultsHeader } from './vision/vision-results-header'
import { VisionPeopleSection } from './vision/vision-people-section'
import { VisionProductsTable } from './vision/vision-products-table'
import { VisionGstSection } from './vision/vision-gst-section'
import { VisionHeadsTails } from './vision/vision-heads-tails'
import { VisionRawTextView } from './vision/vision-raw-text-view'

export function ImageVisionDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const v = useImageVision(open, onOpenChange)

  const items = useVisionItems({
    dialogPeople: v.dialogPeople,
    setDialogPeople: v.setDialogPeople,
    itemsList: v.itemsList,
    setItemsList: v.setItemsList,
    applyTax: v.applyTax,
    customGstRupees: v.customGstRupees,
    personGstShares: v.personGstShares,
    result: v.result,
    headPersonIds: v.headPersonIds,
    headPaidAmounts: v.headPaidAmounts,
    tailHeadPreferences: v.tailHeadPreferences,
    clearExistingBeforeImport: v.clearExistingBeforeImport,
    dispatch: v.dispatch,
    calculate: v.calculate,
    onOpenChange,
    setImported: v.setImported,
    imageSrc: v.imageSrc,
    imageName: v.imageName,
    state: v.state,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-[url('/images/production/dreamy-pastel-background.png')] bg-cover bg-center bg-fixed backdrop-blur-none"
        className="max-w-2xl sm:max-w-[1080px] lg:max-w-[1120px] w-full max-h-[94vh] overflow-y-auto rounded-[28px] border border-white/90 bg-white/95 shadow-[0_25px_70px_rgba(79,70,229,0.22)] backdrop-blur-2xl text-slate-900 p-6 sm:p-8"
      >
        <DialogHeader className="relative pb-2">
          <div className="absolute -top-6 -right-6 pointer-events-none hidden sm:block w-[360px] h-[160px] overflow-hidden rounded-tr-[28px] opacity-90 select-none [mask-image:linear-gradient(to_left,black_70%,transparent_100%)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/production/pastel-fintech-receipts-coin.png" alt="" className="w-full h-full object-cover object-right-top" />
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                  <Sparkles className="size-5" />
                </span>
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  AI Receipt Scanner &amp; OCR Extractor
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-600 leading-relaxed font-normal">
                Extracts exact receipt text verbatim first, then accurately extracts products, quantities, unit prices, and totals for any bill.
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/80">
                  <CheckCircle2 className="size-3 text-emerald-600" /> Accurate Extraction
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200/80">
                  <Zap className="size-3 text-indigo-600" /> Supports Any Receipt
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 border border-violet-200/80">
                  <ShieldCheck className="size-3 text-violet-600" /> Smart Product Detection
                </span>
              </div>
            </div>
            <div className="hidden sm:flex flex-col gap-1 rounded-2xl border border-indigo-200/80 bg-white/90 p-3 shadow-md backdrop-blur-md text-[11px] font-medium text-slate-700 min-w-[170px]">
              <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-600">
                <Sparkles className="size-3.5 fill-indigo-500 text-indigo-500" />
                <span>AI Powered</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Check className="size-3 text-emerald-500 stroke-[3]" />
                <span>Text Recognition</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Check className="size-3 text-emerald-500 stroke-[3]" />
                <span>Product Detection</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Check className="size-3 text-emerald-500 stroke-[3]" />
                <span>Smart Totals</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <VisionStepModels selectedModel={v.selectedModel} onSelectModel={v.setSelectedModel} />
          <VisionStepUpload
            loading={v.loading}
            elapsedSeconds={v.elapsedSeconds}
            imageSrc={v.imageSrc}
            imageName={v.imageName}
            imageMeta={v.imageMeta}
            dragOver={v.dragOver}
            fileInputRef={v.fileInputRef}
            onLoadSample={v.handleLoadSampleReceipt}
            onFileSelect={v.handleFileSelect}
            onReset={v.resetAll}
            setDragOver={v.setDragOver}
          />
          <VisionStepModes
            selectedPromptId={v.selectedPromptId}
            customPrompt={v.customPrompt}
            loading={v.loading}
            elapsedSeconds={v.elapsedSeconds}
            hasImage={!!v.imageSrc}
            onSelectPrompt={(id) => { v.setSelectedPromptId(id); v.setCustomPrompt('') }}
            onAnalyze={() => v.handleAnalyze()}
          />

          {v.result && (
            <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs animate-in fade-in-50">
              <VisionResultsHeader
                result={v.result}
                onViewRawText={() => v.setActiveTab('raw_text')}
                onRetryWithModel={(modelId) => v.handleAnalyze(modelId)}
                onLoadSample={v.handleLoadSampleReceipt}
              />

              {v.result.ok && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-2">
                    <button
                      type="button"
                      onClick={() => v.setActiveTab('products')}
                      className={cn(
                        'flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer',
                        v.activeTab === 'products' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                      )}
                    >
                      <Receipt className="size-3.5" />
                      <span>Detected Products</span>
                      <span className="ml-1 rounded-full bg-white/25 px-1.5 py-0.2 text-[10px] font-extrabold">{v.itemsList.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => v.setActiveTab('raw_text')}
                      className={cn(
                        'flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                        v.activeTab === 'raw_text' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                      )}
                    >
                      <FileCode2 className="size-3.5" />
                      <span>Exact Extracted Text (Raw OCR)</span>
                      {v.result.rawText && (
                        <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700 font-bold">
                          {v.result.rawText.split('\n').filter((l) => l.trim().length > 0).length} lines
                        </span>
                      )}
                    </button>
                  </div>

                  {v.activeTab === 'products' ? (
                    <div className="space-y-4">
                      <VisionPeopleSection
                        dialogPeople={v.dialogPeople}
                        onSetPeople={v.setDialogPeople}
                        onAddPerson={items.handleAddPerson}
                        onRemovePerson={items.handleRemovePerson}
                      />
                      <VisionProductsTable
                        itemsList={v.itemsList}
                        dialogPeople={v.dialogPeople}
                        onItemChange={items.handleItemChange}
                        onAddItem={items.handleAddItem}
                        onDeleteItem={items.handleDeleteItem}
                        onAssignAllToEveryone={items.handleAssignAllToEveryone}
                        onRemoveAllProducts={() => v.setItemsList([])}
                        onTogglePersonForItem={items.handleTogglePersonForItem}
                        onAssignAllForItem={items.handleAssignAllForItem}
                      />
                      <VisionGstSection
                        itemsList={v.itemsList}
                        dialogPeople={v.dialogPeople}
                        computedTotalPaise={v.computedTotalPaise}
                        customGstRupees={v.customGstRupees}
                        setCustomGstRupees={v.setCustomGstRupees}
                        applyTax={v.applyTax}
                        setApplyTax={v.setApplyTax}
                        gstSplitMode={v.gstSplitMode}
                        setGstSplitMode={v.setGstSplitMode}
                        personGstShares={v.personGstShares}
                        setPersonGstShares={v.setPersonGstShares}
                      />
                      <VisionHeadsTails
                        dialogPeople={v.dialogPeople}
                        headPersonIds={v.headPersonIds}
                        setHeadPersonIds={v.setHeadPersonIds}
                        headPaidAmounts={v.headPaidAmounts}
                        setHeadPaidAmounts={v.setHeadPaidAmounts}
                        tailHeadPreferences={v.tailHeadPreferences}
                        setTailHeadPreferences={v.setTailHeadPreferences}
                        totalBillRupees={v.totalBillRupees}
                        tailPeople={v.tailPeople}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                          <Checkbox
                            checked={v.clearExistingBeforeImport}
                            onCheckedChange={(checked) => v.setClearExistingBeforeImport(!!checked)}
                          />
                          <span>
                            Replace current bill products with these analyzed products{' '}
                            <span className="text-muted-foreground">(removes old items)</span>
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs h-9">
                            Cancel
                          </Button>
                          <Button
                            onClick={items.handleImportItems}
                            disabled={v.itemsList.length === 0}
                            className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow font-semibold text-xs px-4 h-9 cursor-pointer"
                          >
                            <ShieldCheck className="size-4 text-emerald-200" />
                            {v.dialogPeople.length > 0
                              ? `Import & Lock for Group (${v.dialogPeople.length}) →`
                              : 'Import & Proceed to Bill Split →'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <VisionRawTextView activeTab={v.activeTab} rawText={v.result.rawText} description={v.result.description} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
