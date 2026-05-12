"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ClientErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  label: string;
};

type ClientErrorBoundaryState = {
  hasError: boolean;
};

export class ClientErrorBoundary extends Component<
  ClientErrorBoundaryProps,
  ClientErrorBoundaryState
> {
  state: ClientErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ClientErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ClientErrorBoundary]", {
      label: this.props.label,
      message: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
