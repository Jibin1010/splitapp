import 'package:flutter/material.dart';
import '../../core/money.dart';
import '../../theme/app_theme.dart';
export 'number_input_fields.dart';

class MoneyInputField extends StatefulWidget {
  final int value; // in paise
  final ValueChanged<int> onCommit;
  final String? hintText;
  final TextStyle? style;
  final bool borderless;
  final double? width;

  const MoneyInputField({
    super.key,
    required this.value,
    required this.onCommit,
    this.hintText = '0.00',
    this.style,
    this.borderless = false,
    this.width,
  });

  @override
  State<MoneyInputField> createState() => _MoneyInputFieldState();
}

class _MoneyInputFieldState extends State<MoneyInputField> {
  late TextEditingController _controller;
  late FocusNode _focusNode;
  int _lastCommitted = 0;

  @override
  void initState() {
    super.initState();
    _lastCommitted = widget.value;
    _controller = TextEditingController(
      text: widget.value == 0 ? '' : amountToInputString(widget.value),
    );
    _focusNode = FocusNode();
    _focusNode.addListener(_onFocusChange);
  }

  void _onFocusChange() {
    if (_focusNode.hasFocus) {
      _controller.selection = TextSelection(
        baseOffset: 0,
        extentOffset: _controller.text.length,
      );
    } else {
      _controller.text =
          _lastCommitted == 0 ? '' : amountToInputString(_lastCommitted);
    }
  }

  @override
  void didUpdateWidget(covariant MoneyInputField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != _lastCommitted && !_focusNode.hasFocus) {
      _lastCommitted = widget.value;
      _controller.text =
          widget.value == 0 ? '' : amountToInputString(widget.value);
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String text) {
    final parsed = parseAmount(text);
    if (parsed != null && parsed >= 0) {
      _lastCommitted = parsed;
      widget.onCommit(parsed);
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget field = TextField(
      controller: _controller,
      focusNode: _focusNode,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      textAlign: TextAlign.right,
      style: widget.style ??
          const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            fontFamily: 'monospace',
            color: AppColors.textPrimary,
          ),
      decoration: InputDecoration(
        hintText: widget.hintText,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        filled: !widget.borderless,
        fillColor:
            widget.borderless ? Colors.transparent : AppColors.surfaceElevated,
        border: widget.borderless
            ? InputBorder.none
            : OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: const BorderSide(color: AppColors.border),
              ),
        enabledBorder: widget.borderless
            ? InputBorder.none
            : OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide: const BorderSide(color: AppColors.border),
              ),
        focusedBorder: widget.borderless
            ? OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide:
                    const BorderSide(color: AppColors.primary, width: 1.5),
              )
            : OutlineInputBorder(
                borderRadius: BorderRadius.circular(6),
                borderSide:
                    const BorderSide(color: AppColors.primary, width: 1.5),
              ),
      ),
      onChanged: _onChanged,
    );

    if (widget.width != null) {
      return SizedBox(width: widget.width, child: field);
    }
    return field;
  }
}
